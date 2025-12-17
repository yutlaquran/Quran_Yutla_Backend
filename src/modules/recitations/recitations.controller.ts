import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Query,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { RecitationsService } from './recitations.service';
import { CreateRecitationDto } from './dto/create-recitation.dto';
import { CreateDirectRecitationDto } from './dto/create-direct-recitation.dto';
import { RecitationQueryDto } from './dto/recitation-query.dto';
import { AIWebhookRequestDto, AIWebhookResponseDto } from './dto/ai-webhook.dto';
import { TeacherEvaluationDto } from './dto/teacher-evaluation.dto';
import { Recitation } from './entities/recitation.entity';
import { Auth } from '../../common/guards/auth.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RolesEnum } from '../../common/enums/roles.enum';
import { CurrentUser } from '../../common/guards/user.decorator';
import { User } from '../user/entities/user.entity';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';

@ApiTags('Recitations')
@ApiBearerAuth()
@Controller({ path: 'recitations', version: '1' })
export class RecitationsController {
  constructor(private readonly recitationsService: RecitationsService) {}

  @Post('upload')
  @Auth(RolesEnum.STUDENT)
  @UseInterceptors(FileInterceptor('audio'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload recitation audio (Student only)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['audio', 'surahId', 'fromAyah', 'toAyah'],
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
          description: 'Audio file (MP3, WAV, M4A - max 100MB)',
        },
        surahId: {
          type: 'number',
          example: 1,
          description: 'Surah ID (1-114)',
        },
        fromAyah: {
          type: 'number',
          example: 1,
          description: 'Starting Ayah number',
        },
        toAyah: {
          type: 'number',
          example: 7,
          description: 'Ending Ayah number',
        },
        notes: {
          type: 'string',
          example: 'First attempt at Surah Al-Fatiha',
          description: 'Optional notes',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recitation uploaded successfully',
    type: Recitation,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file type or size, or no active subscription',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Student role required or no remaining sessions',
  })
  @SuccessResponse(
    'recitations.RECITATION_UPLOADED_SUCCESSFULLY',
    HttpStatus.CREATED,
  )
  async create(
    @CurrentUser() user: User,
    @Body() createRecitationDto: CreateRecitationDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.recitationsService.create(
      user.id,
      createRecitationDto,
      file,
    );
  }

  @Post('record-direct')
  @Auth(RolesEnum.STUDENT)
  @UseInterceptors(FileInterceptor('audioBlob'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Record recitation directly (Student only)',
    description: 'Upload audio blob from direct recording in the app',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['audioBlob', 'surahId', 'fromAyah', 'toAyah'],
      properties: {
        audioBlob: {
          type: 'string',
          format: 'binary',
          description: 'Audio blob from MediaRecorder (WebM, MP4, WAV - max 100MB)',
        },
        surahId: {
          type: 'number',
          example: 1,
          description: 'Surah ID (1-114)',
        },
        fromAyah: {
          type: 'number',
          example: 1,
          description: 'Starting Ayah number',
        },
        toAyah: {
          type: 'number',
          example: 7,
          description: 'Ending Ayah number',
        },
        notes: {
          type: 'string',
          example: 'Direct recording from app',
          description: 'Optional notes',
        },
        audioFormat: {
          type: 'string',
          example: 'webm',
          description: 'Audio format (webm, mp4, wav, etc.)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Direct recitation uploaded successfully',
    type: Recitation,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid audio blob or size, or no active subscription',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Student role required or no remaining sessions',
  })
  @SuccessResponse(
    'recitations.DIRECT_RECITATION_UPLOADED_SUCCESSFULLY',
    HttpStatus.CREATED,
  )
  async recordDirect(
    @CurrentUser() user: User,
    @Body() createDirectRecitationDto: CreateDirectRecitationDto,
    @UploadedFile() audioBlob: Express.Multer.File,
  ) {
    return await this.recitationsService.createDirectRecording(
      user.id,
      createDirectRecitationDto,
      audioBlob,
    );
  }

  @Get('me')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Get my recitations with pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recitations retrieved successfully',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Recitation' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 50 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'recitations.RECITATIONS_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async findMine(
    @CurrentUser() user: User,
    @Query() query: RecitationQueryDto,
  ) {
    return await this.recitationsService.findAll(user.id, query);
  }

  @Get('me/statistics')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Get my recitation statistics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      properties: {
        totalRecitations: { type: 'number', example: 50 },
        completedRecitations: { type: 'number', example: 45 },
        averageScore: { type: 'number', example: 85.5 },
        totalDuration: { type: 'number', example: 18000 },
        recitationsBySurah: {
          type: 'object',
          example: { '1': 5, '2': 3 },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'recitations.STATISTICS_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async getMyStatistics(@CurrentUser() user: User) {
    return await this.recitationsService.getStatistics(user.id);
  }

  // ==================== Parent Reports ====================

  @Get('parent/children')
  @Auth(RolesEnum.PARENT)
  @ApiOperation({
    summary: 'Get overview of all children linked to the parent',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Children overview retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'recitations.RECITATIONS_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async getParentChildrenOverview(@CurrentUser() parent: User) {
    return await this.recitationsService.getParentChildrenOverview(parent.id);
  }

  @Get('parent/children/:childId/recitations')
  @Auth(RolesEnum.PARENT)
  @ApiOperation({
    summary: 'Get recitations for a specific child',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Child recitations retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'recitations.RECITATIONS_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async getParentChildRecitations(
    @CurrentUser() parent: User,
    @Param('childId', ParseIntPipe) childId: number,
    @Query() query: RecitationQueryDto,
  ) {
    return await this.recitationsService.getParentChildRecitations(
      parent.id,
      childId,
      query,
    );
  }

  @Get('parent/children/:childId/statistics')
  @Auth(RolesEnum.PARENT)
  @ApiOperation({
    summary: 'Get statistics for a specific child',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Child statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'recitations.STATISTICS_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async getParentChildStatistics(
    @CurrentUser() parent: User,
    @Param('childId', ParseIntPipe) childId: number,
  ) {
    return await this.recitationsService.getParentChildStatistics(
      parent.id,
      childId,
    );
  }

  // ==================== Teacher Reports ====================

  @Get('teacher/students')
  @Auth(RolesEnum.TEACHER)
  @ApiOperation({
    summary: 'Get overview of all students linked to the teacher',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Students overview retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'recitations.RECITATIONS_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async getTeacherStudentsOverview(@CurrentUser() teacher: User) {
    return await this.recitationsService.getTeacherStudentsOverview(teacher.id);
  }

  @Get('teacher/students/:studentId/recitations')
  @Auth(RolesEnum.TEACHER)
  @ApiOperation({
    summary: 'Get recitations for a specific student linked to the teacher',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student recitations retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'recitations.RECITATIONS_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async getTeacherStudentRecitations(
    @CurrentUser() teacher: User,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: RecitationQueryDto,
  ) {
    return await this.recitationsService.getTeacherStudentRecitations(
      teacher.id,
      studentId,
      query,
    );
  }

  @Get('teacher/students/:studentId/statistics')
  @Auth(RolesEnum.TEACHER)
  @ApiOperation({
    summary: 'Get statistics for a specific student linked to the teacher',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'recitations.STATISTICS_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async getTeacherStudentStatistics(
    @CurrentUser() teacher: User,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return await this.recitationsService.getTeacherStudentStatistics(
      teacher.id,
      studentId,
    );
  }

  @Get(':id')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Get recitation by ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recitation retrieved successfully',
    type: Recitation,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recitation not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Can only access own recitations',
  })
  @SuccessResponse(
    'recitations.RECITATION_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return await this.recitationsService.findOne(id, user.id);
  }

  @Delete(':id')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Delete recitation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recitation deleted successfully',
    schema: {
      properties: {
        deleted: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recitation not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Can only delete own recitations',
  })
  @SuccessResponse(
    'recitations.RECITATION_DELETED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    await this.recitationsService.remove(id, user.id);
    return { deleted: true };
  }

  @Get('admin/:id')
  @Auth(RolesEnum.ADMIN, RolesEnum.TEACHER)
  @ApiOperation({
    summary: 'Get recitation by ID (Admin/Teacher)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recitation retrieved successfully',
    type: Recitation,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recitation not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin or Teacher role required',
  })
  @SuccessResponse(
    'recitations.RECITATION_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    return await this.recitationsService.findOneAdmin(id);
  }

  @Post('webhook/ai-evaluation')
  @Public()
  @ApiOperation({
    summary: 'Webhook endpoint for AI evaluation results',
    description:
      'This endpoint is called by the AI service after processing a recitation. It requires webhook secret authentication.',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token with webhook secret',
    required: true,
  })
  @ApiBody({
    type: AIWebhookRequestDto,
    description: 'AI evaluation results',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evaluation received and saved successfully',
    type: AIWebhookResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid webhook secret',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recitation not found or invalid jobId',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid webhook data',
  })
  async handleAIWebhook(
    @Body() webhookData: AIWebhookRequestDto,
    @Headers('authorization') authHeader: string,
  ): Promise<AIWebhookResponseDto> {
    return await this.recitationsService.handleAIWebhook(webhookData, authHeader);
  }

  // ============= Teacher Evaluation Endpoints =============

  @Get('teacher/:recitationId')
  @Auth(RolesEnum.TEACHER)
  @ApiOperation({
    summary: 'Get recitation for teacher evaluation (Teacher only)',
    description:
      'Allows teacher to retrieve a student recitation with audio URL for evaluation. Teacher must have access to the student.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recitation retrieved successfully',
    type: Recitation,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recitation or teacher not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Teacher does not have access to this student',
  })
  async getRecitationForTeacher(
    @CurrentUser() teacher: User,
    @Param('recitationId', ParseIntPipe) recitationId: number,
  ): Promise<Recitation> {
    return await this.recitationsService.getRecitationForTeacher(
      teacher.id,
      recitationId,
    );
  }

  @Post('teacher/:recitationId/evaluate')
  @Auth(RolesEnum.TEACHER)
  @ApiOperation({
    summary: 'Add teacher evaluation to recitation (Teacher only)',
    description:
      'Allows teacher to add manual evaluation (score 0-100 and optional notes) to a student recitation. Can only be done once per recitation.',
  })
  @ApiBody({
    type: TeacherEvaluationDto,
    description: 'Teacher evaluation with score and optional notes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher evaluation added successfully',
    type: Recitation,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Evaluation already exists or invalid data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recitation or teacher not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Teacher does not have access to this student',
  })
  async addTeacherEvaluation(
    @CurrentUser() teacher: User,
    @Param('recitationId', ParseIntPipe) recitationId: number,
    @Body() evaluationDto: TeacherEvaluationDto,
  ): Promise<Recitation> {
    return await this.recitationsService.addTeacherEvaluation(
      teacher.id,
      recitationId,
      evaluationDto,
    );
  }

  @Patch('teacher/:recitationId/evaluate')
  @Auth(RolesEnum.TEACHER)
  @ApiOperation({
    summary: 'Update existing teacher evaluation (Teacher only)',
    description:
      'Allows teacher to update their own evaluation. Only the teacher who created the evaluation can update it.',
  })
  @ApiBody({
    type: TeacherEvaluationDto,
    description: 'Updated teacher evaluation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher evaluation updated successfully',
    type: Recitation,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No evaluation exists to update',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recitation or teacher not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Teacher does not have access to this student or cannot update another teacher\'s evaluation',
  })
  async updateTeacherEvaluation(
    @CurrentUser() teacher: User,
    @Param('recitationId', ParseIntPipe) recitationId: number,
    @Body() evaluationDto: TeacherEvaluationDto,
  ): Promise<Recitation> {
    return await this.recitationsService.updateTeacherEvaluation(
      teacher.id,
      recitationId,
      evaluationDto,
    );
  }
}
