import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RecitationStatus } from '../entities/recitation.entity';

export class RecitationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by surah ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  surahId?: number;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: RecitationStatus,
  })
  @IsOptional()
  @IsEnum(RecitationStatus)
  status?: RecitationStatus;
}
