import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SessionCount, SessionDuration } from '../entities/plan.entity';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Plan name in English',
    example: 'Basic Plan',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'English name is required' })
  @IsString()
  @MaxLength(100)
  nameEn: string;

  @ApiProperty({
    description: 'Plan name in Arabic',
    example: 'الباقة الأساسية',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Arabic name is required' })
  @IsString()
  @MaxLength(100)
  nameAr: string;

  @ApiPropertyOptional({
    description: 'Plan description in English',
    example: '12 sessions per month, 30 minutes each',
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Plan description in Arabic',
    example: '١٢ جلسة شهرياً، ٣٠ دقيقة لكل جلسة',
  })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiProperty({
    description: 'Session duration in minutes',
    enum: SessionDuration,
    example: SessionDuration.THIRTY_MINUTES,
  })
  @IsNotEmpty({ message: 'Session duration is required' })
  @IsEnum(SessionDuration, {
    message: 'Session duration must be 30 or 60 minutes',
  })
  sessionDuration: SessionDuration;

  @ApiProperty({
    description: 'Number of sessions per month',
    enum: SessionCount,
    example: SessionCount.TWELVE,
  })
  @IsNotEmpty({ message: 'Session count is required' })
  @IsEnum(SessionCount, {
    message: 'Session count must be 8, 12, 16, 20, or 24',
  })
  sessionCount: SessionCount;

  @ApiProperty({
    description: 'Base price in USD',
    example: 29.99,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'Base price is required' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({
    description: 'Country-specific pricing (ISO country code as key)',
    example: { Egypt: 500, 'Saudi Arabia': 200, UAE: 150 },
  })
  @IsOptional()
  @IsObject()
  countryPricing?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Discount percentage',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Is the plan active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Mark as popular/recommended plan',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({
    description: 'Display order (lower = higher priority)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
