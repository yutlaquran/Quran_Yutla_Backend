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
import { Plan } from '../../plans/entities/plan.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING_PAYMENT = 'pending_payment',
}

@Entity('subscriptions')
export class Subscription {
  @ApiProperty({
    description: 'Subscription ID',
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
    description: 'Plan ID',
    example: 1,
  })
  @Column({ name: 'plan_id' })
  planId: number;

  @ApiPropertyOptional({
    description: 'Plan details',
    type: () => Plan,
  })
  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @ApiProperty({
    description: 'Subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING_PAYMENT,
  })
  status: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Subscription start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Column({
    name: 'start_date',
    type: 'timestamp',
    nullable: true,
  })
  startDate: Date;

  @ApiPropertyOptional({
    description: 'Subscription end date',
    example: '2024-02-01T00:00:00.000Z',
  })
  @Column({
    name: 'end_date',
    type: 'timestamp',
    nullable: true,
  })
  endDate: Date;

  @ApiProperty({
    description: 'Total sessions from plan (8, 12, 16, 20, 24)',
    example: 12,
  })
  @Column({
    name: 'total_sessions',
    type: 'int',
    comment: 'Total sessions from plan (8, 12, 16, 20, 24)',
  })
  totalSessions: number;

  @ApiProperty({
    description: 'Sessions remaining this month',
    example: 8,
  })
  @Column({
    name: 'remaining_sessions',
    type: 'int',
    comment: 'Sessions remaining this month',
  })
  remainingSessions: number;

  @ApiProperty({
    description: 'Duration per session in minutes (30 or 60)',
    example: 30,
  })
  @Column({
    name: 'session_duration',
    type: 'int',
    comment: 'Duration per session in minutes (30 or 60)',
  })
  sessionDuration: number;

  @ApiProperty({
    description: 'Auto-renew subscription monthly',
    example: true,
  })
  @Column({
    name: 'auto_renew',
    type: 'boolean',
    default: true,
    comment: 'Auto-renew subscription monthly',
  })
  autoRenew: boolean;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'visa',
  })
  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod: string;

  @ApiPropertyOptional({
    description: 'Last payment date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Column({
    name: 'last_payment_date',
    type: 'timestamp',
    nullable: true,
  })
  lastPaymentDate: Date;

  @ApiPropertyOptional({
    description: 'Next billing date',
    example: '2024-02-01T00:00:00.000Z',
  })
  @Column({
    name: 'next_billing_date',
    type: 'timestamp',
    nullable: true,
  })
  nextBillingDate: Date;

  @ApiPropertyOptional({
    description: 'Cancellation timestamp',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Column({
    name: 'cancelled_at',
    type: 'timestamp',
    nullable: true,
  })
  cancelledAt: Date;

  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Too expensive',
  })
  @Column({
    name: 'cancellation_reason',
    type: 'text',
    nullable: true,
  })
  cancellationReason: string;

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
