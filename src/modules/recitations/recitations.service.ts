import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Recitation, RecitationStatus } from './entities/recitation.entity';
import { CreateRecitationDto } from './dto/create-recitation.dto';
import { CreateDirectRecitationDto } from './dto/create-direct-recitation.dto';
import { RecitationQueryDto } from './dto/recitation-query.dto';
import { AIWebhookRequestDto } from './dto/ai-webhook.dto';
import { TeacherEvaluationDto } from './dto/teacher-evaluation.dto';
import { CustomI18nService } from '../../common/services/custom-i18n.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { FileUploadService } from '../../common/fileUpload/fileUpload.service';
import { AIService } from '../../common/services/ai.service';
import { User } from '../user/entities/user.entity';
import { Surah } from '../quran/entities/surah.entity';

@Injectable()
export class RecitationsService {
  private readonly logger = new Logger(RecitationsService.name);
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly webhookSecret: string;

  constructor(
    @InjectRepository(Recitation)
    private readonly recitationRepository: Repository<Recitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Surah)
    private readonly surahRepository: Repository<Surah>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly fileUploadService: FileUploadService,
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
    private readonly i18n: CustomI18nService,
  ) {
    this.webhookSecret = this.configService.get<string>('ai.webhookSecret') || '';

    // An empty secret is a silent kill switch: `isValidWebhookAuth` rejects
    // every callback, the AI service does NOT retry a 4xx, and every evaluation
    // is lost while recitations sit in PROCESSING until the stale-sweep refunds
    // them. Nothing in the request path would look broken. Fail at boot instead.
    const appEnv =
      this.configService.get<string>('APP_ENV') || process.env.APP_ENV;
    const isProduction =
      appEnv === 'production' || process.env.NODE_ENV === 'production';

    if (!this.webhookSecret) {
      const message =
        'AI_WEBHOOK_SECRET is not set. AI evaluation callbacks will be rejected ' +
        'with 401 and every result will be discarded (the AI service does not ' +
        'retry 4xx).';

      if (isProduction) {
        throw new Error(message);
      }
      this.logger.warn(`${message} Allowed outside production only.`);
    }
  }

  async create(
    userId: number,
    createRecitationDto: CreateRecitationDto,
    file: Express.Multer.File,
  ): Promise<Recitation> {
    // Check subscription and sessions
    const canRecord = await this.subscriptionsService.canRecordRecitation(userId);
    
    if (!canRecord.allowed) {
      throw new ForbiddenException(canRecord.reason);
    }

    // Validate file
    if (!file) {
      throw new BadRequestException(
        this.i18n.t('recitations.AUDIO_FILE_REQUIRED'),
      );
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        this.i18n.t('recitations.FILE_TOO_LARGE'),
      );
    }

    // Validate audio format
    const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        this.i18n.t('recitations.INVALID_AUDIO_FORMAT'),
      );
    }

    // Validate ayah range
    if (createRecitationDto.fromAyah > createRecitationDto.toAyah) {
      throw new BadRequestException(
        this.i18n.t('recitations.INVALID_AYAH_RANGE'),
      );
    }

    // Upload to S3
    const uploadResult = await this.fileUploadService.processAndSaveFile(
      file,
      'recitations',
    );

    // Get audio duration (approximate from file size)
    const approximateDuration = Math.floor(file.size / 16000); // Rough estimate

    // Create recitation record
    const recitation = this.recitationRepository.create({
      userId,
      surahId: createRecitationDto.surahId,
      fromAyah: createRecitationDto.fromAyah,
      toAyah: createRecitationDto.toAyah,
      audioUrl: uploadResult.url,
      audioKey: uploadResult.filename,
      duration: approximateDuration,
      fileSize: uploadResult.size,
      notes: createRecitationDto.notes,
      status: RecitationStatus.PENDING,
    });

    const savedRecitation = await this.recitationRepository.save(recitation);

    // Decrement user's remaining sessions
    await this.subscriptionsService.decrementSession(userId);

    // Submit to AI for evaluation (async - don't await)
    this.submitToAI(savedRecitation).catch((error) => {
      this.logger.error(
        `Failed to submit recitation ${savedRecitation.id} to AI service`,
        error.stack,
      );
    });

    return savedRecitation;
  }

  async createDirectRecording(
    userId: number,
    createDirectRecitationDto: CreateDirectRecitationDto,
    audioBlob: Express.Multer.File,
  ): Promise<Recitation> {
    // Check subscription and sessions
    const canRecord = await this.subscriptionsService.canRecordRecitation(userId);
    
    if (!canRecord.allowed) {
      throw new ForbiddenException(canRecord.reason);
    }

    // Validate audio blob
    if (!audioBlob) {
      throw new BadRequestException(
        this.i18n.t('recitations.AUDIO_BLOB_REQUIRED'),
      );
    }

    if (audioBlob.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        this.i18n.t('recitations.FILE_TOO_LARGE'),
      );
    }

    // Validate audio format - support common web recording formats
    const allowedMimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'video/webm', // Sometimes MediaRecorder uses video/webm for audio
    ];
    
    if (!allowedMimeTypes.includes(audioBlob.mimetype)) {
      throw new BadRequestException(
        this.i18n.t('recitations.INVALID_AUDIO_FORMAT') + ` (${audioBlob.mimetype})`,
      );
    }

    // Validate ayah range
    if (createDirectRecitationDto.fromAyah > createDirectRecitationDto.toAyah) {
      throw new BadRequestException(
        this.i18n.t('recitations.INVALID_AYAH_RANGE'),
      );
    }

    // Determine file extension based on format
    const audioFormat = createDirectRecitationDto.audioFormat || 'webm';
    const fileExtension = this.getFileExtension(audioBlob.mimetype, audioFormat);

    // Update filename with correct extension
    const originalName = audioBlob.originalname || 'recording';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    audioBlob.originalname = `${baseName}.${fileExtension}`;

    // Upload to S3
    const uploadResult = await this.fileUploadService.processAndSaveFile(
      audioBlob,
      'recitations',
    );

    // Get audio duration (approximate from file size)
    const approximateDuration = Math.floor(audioBlob.size / 16000); // Rough estimate

    // Create recitation record
    const recitation = this.recitationRepository.create({
      userId,
      surahId: createDirectRecitationDto.surahId,
      fromAyah: createDirectRecitationDto.fromAyah,
      toAyah: createDirectRecitationDto.toAyah,
      audioUrl: uploadResult.url,
      audioKey: uploadResult.filename,
      duration: approximateDuration,
      fileSize: uploadResult.size,
      notes: createDirectRecitationDto.notes,
      status: RecitationStatus.PENDING,
    });

    const savedRecitation = await this.recitationRepository.save(recitation);

    // Decrement user's remaining sessions
    await this.subscriptionsService.decrementSession(userId);

    // Submit to AI for evaluation (async - don't await)
    this.submitToAI(savedRecitation).catch((error) => {
      this.logger.error(
        `Failed to submit recitation ${savedRecitation.id} to AI service`,
        error.stack,
      );
    });

    return savedRecitation;
  }

  /**
   * Helper method to determine file extension based on MIME type
   */
  private getFileExtension(mimeType: string, requestedFormat?: string): string {
    // If format is explicitly requested, use it
    if (requestedFormat) {
      return requestedFormat;
    }

    // Map MIME types to extensions
    const mimeToExtension: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/ogg': 'ogg',
      'audio/ogg;codecs=opus': 'ogg',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'video/webm': 'webm',
    };

    return mimeToExtension[mimeType] || 'webm';
  }

  async findAll(
    userId: number,
    query: RecitationQueryDto,
  ): Promise<{ data: Recitation[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, surahId, status } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.recitationRepository
      .createQueryBuilder('recitation')
      .where('recitation.user_id = :userId', { userId });

    if (surahId) {
      queryBuilder.andWhere('recitation.surah_id = :surahId', { surahId });
    }

    if (status) {
      queryBuilder.andWhere('recitation.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .orderBy('recitation.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, userId: number): Promise<Recitation> {
    const recitation = await this.recitationRepository.findOne({
      where: { id, userId },
    });

    if (!recitation) {
      throw new NotFoundException(
        this.i18n.t('recitations.RECITATION_NOT_FOUND'),
      );
    }

    return recitation;
  }

  async findOneAdmin(id: number): Promise<Recitation> {
    const recitation = await this.recitationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!recitation) {
      throw new NotFoundException(
        this.i18n.t('recitations.RECITATION_NOT_FOUND'),
      );
    }

    return recitation;
  }

  async remove(id: number, userId: number): Promise<void> {
    const recitation = await this.findOne(id, userId);

    // Delete from S3
    await this.fileUploadService.deleteFile(recitation.audioKey);

    // Delete from database
    await this.recitationRepository.remove(recitation);
  }

  /**
   * A recitation only leaves PENDING/PROCESSING when the AI service calls our
   * webhook. If the AI service crashes, loses the job, or the callback is
   * dropped, the recitation is stuck forever and the student sees a permanent
   * spinner. Sweep anything that has not moved in `olderThanMinutes`.
   */
  async failStaleProcessingRecitations(
    olderThanMinutes = 60,
  ): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);

    // Fetched rather than bulk-updated because each one needs its own owner's
    // session refunded, and a bulk UPDATE cannot tell us whose they were.
    const stale = await this.recitationRepository
      .createQueryBuilder('recitation')
      .select(['recitation.id', 'recitation.userId'])
      .where('recitation.status IN (:...statuses)', {
        statuses: [RecitationStatus.PENDING, RecitationStatus.PROCESSING],
      })
      .andWhere('recitation.updatedAt < :cutoff', { cutoff })
      .getMany();

    if (stale.length === 0) {
      return 0;
    }

    let swept = 0;
    for (const recitation of stale) {
      try {
        await this.markFailedAndRefund(
          recitation.id,
          recitation.userId,
          `no AI callback within ${olderThanMinutes}m`,
        );
        swept += 1;
      } catch (error) {
        // One bad row must not abort the rest of the sweep.
        this.logger.error(
          `Failed to sweep recitation ${recitation.id}: ${error.message}`,
        );
      }
    }

    this.logger.warn(
      `Swept ${swept} stale recitation(s) after ${olderThanMinutes}m with no AI callback`,
    );

    return swept;
  }

  async deleteOldRecitations(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldRecitations = await this.recitationRepository.find({
      where: {
        createdAt: LessThan(thirtyDaysAgo),
      },
    });

    let deletedCount = 0;

    for (const recitation of oldRecitations) {
      try {
        // Delete from S3
        await this.fileUploadService.deleteFile(recitation.audioKey);
        
        // Delete from database
        await this.recitationRepository.remove(recitation);
        
        deletedCount++;
      } catch (error) {
        console.error(
          `Failed to delete recitation ${recitation.id}:`,
          error.message,
        );
      }
    }

    console.log(`Deleted ${deletedCount} old recitations (30+ days)`);
    return deletedCount;
  }

  async updateEvaluation(
    id: number,
    score: number,
    evaluationData: any,
  ): Promise<Recitation> {
    const recitation = await this.recitationRepository.findOne({
      where: { id },
    });

    if (!recitation) {
      throw new NotFoundException(
        this.i18n.t('recitations.RECITATION_NOT_FOUND'),
      );
    }

    recitation.evaluationScore = score;
    recitation.evaluationData = evaluationData;
    recitation.status = RecitationStatus.COMPLETED;

    return await this.recitationRepository.save(recitation);
  }

  async getStatistics(userId: number): Promise<{
    totalRecitations: number;
    averageScore: number;
    completedRecitations: number;
    pendingRecitations: number;
    totalDuration: number;
    recitationsBySurah: Record<string, number>;
  }> {
    const [totalRecitations, completedRecitations, pendingRecitations] =
      await Promise.all([
        this.recitationRepository.count({ where: { userId } }),
        this.recitationRepository.count({
          where: { userId, status: RecitationStatus.COMPLETED },
        }),
        this.recitationRepository.count({
          where: { userId, status: RecitationStatus.PENDING },
        }),
      ]);

    const { avg } = await this.recitationRepository
      .createQueryBuilder('recitation')
      .select('AVG(recitation.evaluation_score)', 'avg')
      .where('recitation.user_id = :userId', { userId })
      .andWhere('recitation.evaluation_score IS NOT NULL')
      .getRawOne();

    // Calculate total duration
    const { sum } = await this.recitationRepository
      .createQueryBuilder('recitation')
      .select('SUM(recitation.duration)', 'sum')
      .where('recitation.user_id = :userId', { userId })
      .andWhere('recitation.duration IS NOT NULL')
      .getRawOne();

    // Get recitations grouped by surah
    const recitationsBySurah = await this.recitationRepository
      .createQueryBuilder('recitation')
      .select('recitation.surah_id', 'surahId')
      .addSelect('COUNT(*)', 'count')
      .where('recitation.user_id = :userId', { userId })
      .groupBy('recitation.surah_id')
      .getRawMany();

    // Convert to object format
    const recitationsBySurahObject = recitationsBySurah.reduce(
      (acc, item) => {
        acc[item.surahId] = parseInt(item.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalRecitations,
      averageScore: avg ? parseFloat(avg) : 0,
      completedRecitations,
      pendingRecitations,
      totalDuration: sum ? parseInt(sum) : 0,
      recitationsBySurah: recitationsBySurahObject,
    };
  }

  // ==================== Parent Reports ====================

  async getParentChildrenOverview(parentId: number) {
    const children = await this.userRepository.find({
      where: { parentId },
      select: [
        'id',
        'fullName',
        'email',
        'phoneNumber',
        'country',
        'ageGroup',
        'profileImageUrl',
        'studentCode',
        'parentId',
      ],
      order: { fullName: 'ASC' },
    });

    const data = await Promise.all(
      children.map(async (child) => {
        const [statistics, latestRecitation] = await Promise.all([
          this.getStatistics(child.id),
          this.getLatestRecitation(child.id),
        ]);

        return {
          child: this.mapUserSummary(child),
          statistics,
          latestRecitation,
        };
      }),
    );

    return {
      total: data.length,
      data,
    };
  }

  async getParentChildRecitations(
    parentId: number,
    childId: number,
    query: RecitationQueryDto,
  ) {
    const child = await this.findChildForParent(parentId, childId);
    const recitations = await this.findAll(child.id, query);

    return {
      child: this.mapUserSummary(child),
      ...recitations,
    };
  }

  async getParentChildStatistics(parentId: number, childId: number) {
    const child = await this.findChildForParent(parentId, childId);
    const statistics = await this.getStatistics(child.id);

    return {
      child: this.mapUserSummary(child),
      statistics,
    };
  }

  // ==================== Teacher Reports ====================

  async getTeacherStudentsOverview(teacherId: number) {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      relations: ['students'],
    });

    if (!teacher) {
      throw new NotFoundException(this.i18n.t('user.TEACHER_NOT_FOUND'));
    }

    const students = teacher.students || [];

    const data = await Promise.all(
      students.map(async (student) => {
        const [statistics, latestRecitation] = await Promise.all([
          this.getStatistics(student.id),
          this.getLatestRecitation(student.id),
        ]);

        return {
          student: this.mapUserSummary(student),
          statistics,
          latestRecitation,
        };
      }),
    );

    return {
      total: data.length,
      data,
    };
  }

  async getTeacherStudentRecitations(
    teacherId: number,
    studentId: number,
    query: RecitationQueryDto,
  ) {
    const student = await this.findStudentForTeacher(teacherId, studentId);
    const recitations = await this.findAll(student.id, query);

    return {
      student: this.mapUserSummary(student),
      ...recitations,
    };
  }

  async getTeacherStudentStatistics(teacherId: number, studentId: number) {
    const student = await this.findStudentForTeacher(teacherId, studentId);
    const statistics = await this.getStatistics(student.id);

    return {
      student: this.mapUserSummary(student),
      statistics,
    };
  }

  // ==================== Helpers ====================

  private async findChildForParent(parentId: number, childId: number): Promise<User> {
    const child = await this.userRepository.findOne({
      where: { id: childId, parentId },
      select: [
        'id',
        'fullName',
        'email',
        'phoneNumber',
        'country',
        'ageGroup',
        'profileImageUrl',
        'studentCode',
        'parentId',
      ],
    });

    if (child) {
      return child;
    }

    const exists = await this.userRepository.findOne({
      where: { id: childId },
      select: ['id'],
    });

    if (!exists) {
      throw new NotFoundException(this.i18n.t('user.STUDENT_NOT_FOUND'));
    }

    throw new ForbiddenException(
      this.i18n.t('user.CHILD_NOT_LINKED_TO_PARENT'),
    );
  }

  private async findStudentForTeacher(teacherId: number, studentId: number): Promise<User> {
    const student = await this.userRepository
      .createQueryBuilder('student')
      .innerJoin('student.teachers', 'teacher', 'teacher.id = :teacherId', {
        teacherId,
      })
      .where('student.id = :studentId', { studentId })
      .select([
        'student.id',
        'student.fullName',
        'student.email',
        'student.phoneNumber',
        'student.country',
        'student.ageGroup',
        'student.profileImageUrl',
        'student.studentCode',
      ])
      .getOne();

    if (student) {
      return student;
    }

    const exists = await this.userRepository.findOne({
      where: { id: studentId },
      select: ['id'],
    });

    if (!exists) {
      throw new NotFoundException(this.i18n.t('user.STUDENT_NOT_FOUND'));
    }

    throw new ForbiddenException(
      this.i18n.t('user.STUDENT_NOT_LINKED_TO_TEACHER'),
    );
  }

  private async getLatestRecitation(userId: number) {
    return await this.recitationRepository
      .createQueryBuilder('recitation')
      .where('recitation.user_id = :userId', { userId })
      .orderBy('recitation.created_at', 'DESC')
      .select([
        'recitation.id',
        'recitation.surahId',
        'recitation.fromAyah',
        'recitation.toAyah',
        'recitation.status',
        'recitation.evaluationScore',
        'recitation.createdAt',
      ])
      .getOne();
  }

  private mapUserSummary(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      ageGroup: user.ageGroup,
      profileImageUrl: user.profileImageUrl,
      studentCode: user.studentCode,
    };
  }

  /**
   * Submit recitation to AI service for evaluation
   * This is called asynchronously after saving the recitation
   */
  private async submitToAI(recitation: Recitation): Promise<void> {
    try {
      // Get surah details
      const surah = await this.surahRepository.findOne({
        where: { number: recitation.surahId },
      });

      if (!surah) {
        // Without this the recitation is stranded in PENDING with no AI job
        // ever created, and nothing downstream can tell it apart from one
        // that is still legitimately queued.
        await this.markFailedAndRefund(
          recitation.id,
          recitation.userId,
          `surah ${recitation.surahId} not found`,
        );
        return;
      }

      // Get webhook URL from config. `app.url` must resolve to an address the
      // AI service can reach: if it points at localhost the callback never
      // arrives and the recitation stays PROCESSING forever.
      const apiUrl = this.configService.getOrThrow<string>('app.url');
      const webhookUrl = `${apiUrl}/api/v1/recitations/webhook/ai-evaluation`;

      // Prepare AI request
      const aiRequest = {
        audioUrl: this.toAbsoluteAudioUrl(recitation.audioUrl),
        surahNumber: recitation.surahId,
        surahName: surah.name, // Use 'name' which contains Arabic name
        fromAyah: recitation.fromAyah,
        toAyah: recitation.toAyah,
        userId: recitation.userId,
        recitationId: recitation.id,
        webhookUrl,
        webhookSecret: this.webhookSecret,
      };

      this.logger.log(`Submitting recitation ${recitation.id} to AI service`);

      // Submit to AI
      const response = await this.aiService.submitForEvaluation(aiRequest);

      if (response.status === 'processing' && response.jobId) {
        // Update recitation with jobId and status
        await this.recitationRepository.update(recitation.id, {
          aiJobId: response.jobId,
          status: RecitationStatus.PROCESSING,
        });

        this.logger.log(
          `Recitation ${recitation.id} submitted successfully with jobId: ${response.jobId}`,
        );
      } else if (response.status === 'error') {
        await this.markFailedAndRefund(
          recitation.id,
          recitation.userId,
          `AI service rejected it: ${response.message}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error submitting recitation ${recitation.id} to AI`,
        error.stack,
      );

      await this.markFailedAndRefund(
        recitation.id,
        recitation.userId,
        `submission threw: ${error.message}`,
      );
    }
  }

  /**
   * Move a recitation to FAILED and hand the student's session back.
   *
   * The status update is conditional on the row not already being FAILED, and
   * the refund only fires when that update actually changed something. That
   * makes this idempotent: the AI service is told to retry its webhook on 5xx,
   * and a retry must not refund a second session.
   */
  private async markFailedAndRefund(
    recitationId: number,
    userId: number,
    reason: string,
    evaluationData?: unknown,
  ): Promise<void> {
    const result = await this.recitationRepository
      .createQueryBuilder()
      .update(Recitation)
      .set({
        status: RecitationStatus.FAILED,
        ...(evaluationData !== undefined
          ? { evaluationData: evaluationData as any }
          : {}),
      })
      .where('id = :id', { id: recitationId })
      .andWhere('status != :failed', { failed: RecitationStatus.FAILED })
      .execute();

    if ((result.affected ?? 0) === 0) {
      this.logger.log(
        `Recitation ${recitationId} was already FAILED; skipping duplicate refund`,
      );
      return;
    }

    this.logger.error(`Recitation ${recitationId} FAILED: ${reason}`);
    await this.subscriptionsService.refundSession(userId);
  }

  /**
   * FileUploadService returns a bucket-relative key (e.g. `/recitations/x.mp3`),
   * which is meaningless to an external caller. Prepend the storage base URL so
   * the AI service can actually download the file.
   */
  private toAbsoluteAudioUrl(audioUrl: string): string {
    if (!audioUrl || /^https?:\/\//i.test(audioUrl)) {
      return audioUrl;
    }

    const baseUrl = (
      this.configService.get<string>('OvhStorage.baseUrl') ?? ''
    ).replace(/\/+$/, '');

    if (!baseUrl) {
      this.logger.warn(
        'OvhStorage.baseUrl is not configured; sending a relative audioUrl to the AI service',
      );
      return audioUrl;
    }

    return `${baseUrl}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
  }

  /**
   * Drop the AI service's word tallies before storing the evaluation.
   *
   * `overallScore` is derived from the grader's accuracy, which ignores extra
   * words the student inserted, while `totalWords`/`correctWords`/
   * `incorrectWords` are counted from a `words` array that includes those
   * insertions as rows. A verified run returned `overallScore: 100` alongside
   * `correctWords: 2, totalWords: 3` — correct by each definition, nonsense
   * side by side, and a parent reading "2/3 — 100%" concludes the app is
   * broken. The per-word `words` array is kept: it carries the detail without
   * the contradictory headline. Restore these once the AI service reconciles
   * the two numbers.
   */
  private stripWordCounters(data: unknown): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const {
      totalWords: _totalWords,
      correctWords: _correctWords,
      incorrectWords: _incorrectWords,
      ...rest
    } = data as Record<string, unknown>;

    return rest;
  }

  /**
   * Constant-time comparison of the webhook bearer token. A plain `!==` leaks
   * the secret one byte at a time to an attacker who can measure response time.
   */
  private isValidWebhookAuth(authHeader?: string): boolean {
    if (!this.webhookSecret || !authHeader) {
      return false;
    }

    const expected = Buffer.from(`Bearer ${this.webhookSecret}`);
    const received = Buffer.from(authHeader);

    // timingSafeEqual throws on length mismatch, so check length first. Length
    // is not secret — the token is fixed-width.
    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }

  /**
   * Handle AI evaluation webhook callback
   * This endpoint is called by AI service after processing
   */
  async handleAIWebhook(
    webhookData: AIWebhookRequestDto,
    authHeader: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verify authorization
    if (!this.isValidWebhookAuth(authHeader)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    this.logger.log(
      `Received AI webhook for recitation ${webhookData.recitationId} with jobId ${webhookData.jobId}`,
    );

    // Look the recitation up by id alone, then reconcile the jobId separately.
    // Matching on both columns at once cannot distinguish "this webhook is
    // bogus" from "we have not written aiJobId yet", and those need opposite
    // responses. The callback is already authenticated by the shared secret, so
    // the jobId is a consistency check rather than the security boundary.
    const recitation = await this.recitationRepository.findOne({
      where: { id: webhookData.recitationId },
    });

    if (!recitation) {
      // Answer 503, not 404: the AI service retries 5xx three times but drops a
      // 4xx permanently. If the row is merely not visible yet, a retry saves the
      // evaluation; if the id is genuinely bogus, three ignored retries cost
      // nothing.
      this.logger.error(
        `Recitation not found: recitationId=${webhookData.recitationId}, jobId=${webhookData.jobId}. ` +
          'Returning 503 so the AI service retries.',
      );
      throw new ServiceUnavailableException(
        'Recitation not available yet, please retry',
      );
    }

    if (!recitation.aiJobId) {
      // The result beat our own write of aiJobId (measured: callbacks arrive in
      // ~9s, and the column is only set after submitForEvaluation returns).
      // Adopt the jobId instead of rejecting a legitimate result.
      this.logger.warn(
        `Recitation ${recitation.id} had no aiJobId when its webhook arrived; ` +
          `adopting jobId ${webhookData.jobId}`,
      );
      await this.recitationRepository.update(
        { id: recitation.id, aiJobId: IsNull() },
        { aiJobId: webhookData.jobId },
      );
      recitation.aiJobId = webhookData.jobId;
    } else if (recitation.aiJobId !== webhookData.jobId) {
      // A different job owns this recitation now (e.g. it was resubmitted).
      // Accept the request so the sender stops retrying, but do not let a stale
      // result overwrite the current one.
      this.logger.warn(
        `Ignoring webhook for recitation ${recitation.id}: jobId ${webhookData.jobId} ` +
          `does not match the active job ${recitation.aiJobId}`,
      );
      return {
        success: true,
        message: 'Stale jobId, ignored',
      };
    }

    // Update based on status
    if (webhookData.status === 'success' && webhookData.data) {
      // Extract score and data. `??` not `||`: a legitimate score of 0 (student
      // got everything wrong) must not fall through to the next candidate.
      const rawScore: number =
        webhookData.data.overallScore ??
        webhookData.data.overallAccuracy ??
        webhookData.data.accuracy ??
        0;

      // The contract is 0-100 and the AI service has confirmed and tested it.
      // Deliberately NOT rescaling values below 1: a long ayah range can
      // legitimately score under 1% (one correct word out of 200+), and
      // multiplying that by 100 would turn a near-total failure into a pass.
      //
      // If the AI service ever regresses to sending a 0-1 ratio, this warning
      // fires on every single record — loud, systemic and obvious — instead of
      // silently corrupting the occasional genuine low score. Recovery is then
      // a one-line change plus a backfill, rather than undetectable bad data.
      const evaluationScore = rawScore;

      if (rawScore > 0 && rawScore < 1) {
        this.logger.warn(
          `AI returned score ${rawScore} for recitation ${webhookData.recitationId}. ` +
            'Storing as-is (0-100 scale assumed). If EVERY score looks like this, ' +
            'the AI service is sending a 0-1 ratio and must be fixed.',
        );
      }

      // Only complete a recitation that is still awaiting a result. If the
      // stale-sweep already FAILED-and-refunded it (a callback later than the
      // timeout) or a previous webhook already COMPLETED it, do not re-open it:
      // that would deliver the evaluation on top of an already-refunded
      // session, i.e. a free evaluation.
      const result = await this.recitationRepository
        .createQueryBuilder()
        .update(Recitation)
        .set({
          evaluationScore,
          evaluationData: this.stripWordCounters(webhookData.data),
          status: RecitationStatus.COMPLETED,
        })
        .where('id = :id', { id: recitation.id })
        .andWhere('status IN (:...open)', {
          open: [RecitationStatus.PENDING, RecitationStatus.PROCESSING],
        })
        .execute();

      if ((result.affected ?? 0) === 0) {
        this.logger.warn(
          `Recitation ${recitation.id} was already finalized; ignoring late/duplicate success webhook`,
        );
      } else {
        this.logger.log(
          `Successfully saved AI evaluation for recitation ${recitation.id} with score ${evaluationScore}`,
        );
      }

      return {
        success: true,
        message: 'Evaluation received and saved',
      };
    } else if (webhookData.status === 'error') {
      await this.markFailedAndRefund(
        recitation.id,
        recitation.userId,
        `AI evaluation failed: ${webhookData.message}`,
        { error: true, message: webhookData.message },
      );

      return {
        success: true,
        message: 'Error status received and recorded',
      };
    }

    throw new BadRequestException('Invalid webhook data');
  }

  /**
   * Get a specific recitation for teacher evaluation
   * Ensures the teacher has access to this student's recitations
   */
  async getRecitationForTeacher(
    teacherId: number,
    recitationId: number,
  ): Promise<Recitation> {
    // Get the teacher
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      relations: ['students'],
    });

    if (!teacher) {
      throw new NotFoundException(
        this.i18n.t('recitations.TEACHER_NOT_FOUND'),
      );
    }

    // Get the recitation with student info
    const recitation = await this.recitationRepository.findOne({
      where: { id: recitationId },
      relations: ['user', 'surah'],
    });

    if (!recitation) {
      throw new NotFoundException(
        this.i18n.t('recitations.RECITATION_NOT_FOUND'),
      );
    }

    // Check if the teacher has access to this student
    const hasAccess = teacher.students.some(
      (student) => student.id === recitation.user.id,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        this.i18n.t('recitations.TEACHER_NO_ACCESS_TO_STUDENT'),
      );
    }

    return recitation;
  }

  /**
   * Add teacher evaluation to a recitation
   * Only allowed if no teacher evaluation exists yet
   */
  async addTeacherEvaluation(
    teacherId: number,
    recitationId: number,
    evaluationDto: TeacherEvaluationDto,
  ): Promise<Recitation> {
    // Get and verify recitation access
    const recitation = await this.getRecitationForTeacher(
      teacherId,
      recitationId,
    );

    // Check if evaluation already exists
    if (recitation.teacherEvaluationScore !== null) {
      throw new BadRequestException(
        this.i18n.t('recitations.TEACHER_EVALUATION_ALREADY_EXISTS'),
      );
    }

    // Add evaluation
    recitation.teacherEvaluationScore = evaluationDto.score;
    recitation.teacherNotes = evaluationDto.notes || '';
    recitation.evaluatedByTeacherId = teacherId;
    recitation.teacherEvaluatedAt = new Date();

    await this.recitationRepository.save(recitation);

    this.logger.log(
      `Teacher ${teacherId} added evaluation for recitation ${recitationId} with score ${evaluationDto.score}`,
    );

    return recitation;
  }

  /**
   * Update existing teacher evaluation
   */
  async updateTeacherEvaluation(
    teacherId: number,
    recitationId: number,
    evaluationDto: TeacherEvaluationDto,
  ): Promise<Recitation> {
    // Get and verify recitation access
    const recitation = await this.getRecitationForTeacher(
      teacherId,
      recitationId,
    );

    // Check if evaluation exists
    if (recitation.teacherEvaluationScore === null) {
      throw new BadRequestException(
        this.i18n.t('recitations.TEACHER_EVALUATION_NOT_FOUND'),
      );
    }

    // Check if this teacher created the evaluation
    if (recitation.evaluatedByTeacherId !== teacherId) {
      throw new ForbiddenException(
        this.i18n.t('recitations.TEACHER_CANNOT_UPDATE_OTHER_EVALUATION'),
      );
    }

    // Update evaluation
    recitation.teacherEvaluationScore = evaluationDto.score;
    recitation.teacherNotes = evaluationDto.notes || '';
    recitation.teacherEvaluatedAt = new Date(); // Update timestamp

    await this.recitationRepository.save(recitation);

    this.logger.log(
      `Teacher ${teacherId} updated evaluation for recitation ${recitationId} with new score ${evaluationDto.score}`,
    );

    return recitation;
  }
}
