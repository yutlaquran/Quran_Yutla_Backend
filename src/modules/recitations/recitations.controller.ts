import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RecitationsService } from './recitations.service';
import { CreateRecitationDto } from './dto/create-recitation.dto';
import { CreateDirectRecitationDto } from './dto/create-direct-recitation.dto';
import { RecitationQueryDto } from './dto/recitation-query.dto';
import { Recitation } from './entities/recitation.entity';
import { Auth } from '../../common/guards/auth.decorator';
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
}
