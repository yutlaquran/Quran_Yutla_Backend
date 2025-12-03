import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export enum RecitationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('recitations')
export class Recitation {
  @ApiProperty({
    description: 'Recitation ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiPropertyOptional({
    description: 'User details',
    type: () => User,
  })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'Surah ID (1-114)',
    example: 1,
    minimum: 1,
    maximum: 114,
  })
  @Column({ name: 'surah_id', type: 'int' })
  surahId: number;

  @ApiProperty({
    description: 'From Ayah number',
    example: 1,
  })
  @Column({ name: 'from_ayah', type: 'int' })
  fromAyah: number;

  @ApiProperty({
    description: 'To Ayah number',
    example: 7,
  })
  @Column({ name: 'to_ayah', type: 'int' })
  toAyah: number;

  @ApiProperty({
    description: 'Audio file URL',
    example: 'https://storage.example.com/recitations/user-123/recitation-456.mp3',
  })
  @Column({
    name: 'audio_url',
    type: 'varchar',
    length: 500,
  })
  audioUrl: string;

  @ApiProperty({
    description: 'S3 object key for deletion',
    example: 'recitations/user-123/recitation-456.mp3',
  })
  @Column({
    name: 'audio_key',
    type: 'varchar',
    length: 500,
    comment: 'S3 object key for deletion',
  })
  audioKey: string;

  @ApiProperty({
    description: 'Duration in seconds',
    example: 180,
  })
  @Column({
    name: 'duration',
    type: 'int',
    comment: 'Duration in seconds',
  })
  duration: number;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048000,
  })
  @Column({
    name: 'file_size',
    type: 'bigint',
    comment: 'File size in bytes',
  })
  fileSize: number;

  @ApiProperty({
    description: 'Recitation status',
    enum: RecitationStatus,
    example: RecitationStatus.COMPLETED,
  })
  @Column({
    type: 'enum',
    enum: RecitationStatus,
    default: RecitationStatus.PENDING,
  })
  status: RecitationStatus;

  @ApiPropertyOptional({
    description: 'AI evaluation score (0-100)',
    example: 85.5,
    minimum: 0,
    maximum: 100,
  })
  @Column({
    name: 'evaluation_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'AI evaluation score (0-100)',
  })
  evaluationScore: number;

  @ApiPropertyOptional({
    description: 'Detailed AI evaluation results',
    example: {
      tajweed_score: 90,
      pronunciation_score: 85,
      fluency_score: 80,
      mistakes: [],
    },
  })
  @Column({
    name: 'evaluation_data',
    type: 'jsonb',
    nullable: true,
    comment: 'Detailed AI evaluation results',
  })
  evaluationData: any;

  @ApiPropertyOptional({
    description: 'Optional notes from student',
    example: 'First attempt at Surah Al-Fatiha',
  })
  @Column({
    name: 'notes',
    type: 'text',
    nullable: true,
  })
  notes: string;

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
