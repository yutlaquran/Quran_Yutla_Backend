import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Recitation, RecitationStatus } from './entities/recitation.entity';
import { CreateRecitationDto } from './dto/create-recitation.dto';
import { RecitationQueryDto } from './dto/recitation-query.dto';
import { CustomI18nService } from '../../common/services/custom-i18n.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { FileUploadService } from '../../common/fileUpload/fileUpload.service';

@Injectable()
export class RecitationsService {
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  constructor(
    @InjectRepository(Recitation)
    private readonly recitationRepository: Repository<Recitation>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly fileUploadService: FileUploadService,
    private readonly i18n: CustomI18nService,
  ) {}

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

    return savedRecitation;
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

    return {
      totalRecitations,
      averageScore: avg ? parseFloat(avg) : 0,
      completedRecitations,
      pendingRecitations,
    };
  }
}
