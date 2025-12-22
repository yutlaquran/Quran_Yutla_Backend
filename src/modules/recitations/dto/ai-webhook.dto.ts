import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsIn, IsOptional, IsObject } from 'class-validator';

export class AIWebhookRequestDto {
  @ApiProperty({
    description: 'AI service job ID',
    example: 'ai-job-12345-xyz',
  })
  @IsString()
  jobId: string;

  @ApiProperty({
    description: 'Recitation ID',
    example: 456,
  })
  @IsNumber()
  recitationId: number;

  @ApiProperty({
    description: 'User ID',
    example: 123,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'Evaluation status',
    enum: ['success', 'error'],
    example: 'success',
  })
  @IsIn(['success', 'error'])
  status: 'success' | 'error';

  @ApiProperty({
    description: 'Evaluation data (if status is success)',
    required: false,
    example: {
      overallScore: 85.5,
      totalWords: 50,
      correctWords: 45,
      incorrectWords: 5,
      words: [],
      errors: [],
      errorSummary: {},
      suggestions: [],
    },
  })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiProperty({
    description: 'Error message (if status is error)',
    required: false,
    example: 'Audio file is corrupted',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class AIWebhookResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Evaluation received and saved',
  })
  message: string;
}
