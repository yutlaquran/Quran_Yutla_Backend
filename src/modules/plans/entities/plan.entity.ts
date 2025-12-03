import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SessionDuration {
  THIRTY_MINUTES = 30,
  SIXTY_MINUTES = 60,
}

export enum SessionCount {
  EIGHT = 8,
  TWELVE = 12,
  SIXTEEN = 16,
  TWENTY = 20,
  TWENTY_FOUR = 24,
}

@Entity('plans')
export class Plan {
  @ApiProperty({
    description: 'Plan ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Plan name in English',
    example: 'Basic Plan',
  })
  @Column({ name: 'name_en', length: 100 })
  nameEn: string;

  @ApiProperty({
    description: 'Plan name in Arabic',
    example: 'الباقة الأساسية',
  })
  @Column({ name: 'name_ar', length: 100 })
  nameAr: string;

  @ApiPropertyOptional({
    description: 'Plan description in English',
    example: '12 sessions per month, 30 minutes each',
  })
  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string;

  @ApiPropertyOptional({
    description: 'Plan description in Arabic',
    example: '١٢ جلسة شهرياً، ٣٠ دقيقة لكل جلسة',
  })
  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string;

  @ApiProperty({
    description: 'Session duration in minutes',
    enum: SessionDuration,
    example: SessionDuration.THIRTY_MINUTES,
  })
  @Column({
    type: 'enum',
    enum: SessionDuration,
    name: 'session_duration',
    comment: 'Duration of each session in minutes (30 or 60)',
  })
  sessionDuration: SessionDuration;

  @ApiProperty({
    description: 'Number of sessions per month',
    enum: SessionCount,
    example: SessionCount.TWELVE,
  })
  @Column({
    type: 'enum',
    enum: SessionCount,
    name: 'session_count',
    comment: 'Number of sessions per month (8, 12, 16, 20, 24)',
  })
  sessionCount: SessionCount;

  @ApiProperty({
    description: 'Base price in USD',
    example: 29.99,
  })
  @Column({
    name: 'base_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Base price in USD',
  })
  basePrice: number;

  @ApiPropertyOptional({
    description: 'Country-specific pricing',
    example: { Egypt: 500, 'Saudi Arabia': 200, UAE: 150 },
  })
  @Column({
    type: 'jsonb',
    name: 'country_pricing',
    nullable: true,
    comment: 'Country-specific pricing: { "EG": 500, "SA": 200, "AE": 150 }',
  })
  countryPricing: Record<string, number>;

  @ApiProperty({
    description: 'Discount percentage',
    example: 10,
  })
  @Column({
    name: 'discount_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Discount percentage (0-100)',
  })
  discountPercentage: number;

  @ApiProperty({
    description: 'Is the plan active',
    example: true,
  })
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Mark as popular/recommended plan',
    example: false,
  })
  @Column({
    name: 'is_popular',
    type: 'boolean',
    default: false,
    comment: 'Mark as popular/recommended plan',
  })
  isPopular: boolean;

  @ApiProperty({
    description: 'Display order (lower = higher priority)',
    example: 1,
  })
  @Column({
    name: 'display_order',
    type: 'int',
    default: 0,
    comment: 'Order for displaying plans (lower = higher priority)',
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
