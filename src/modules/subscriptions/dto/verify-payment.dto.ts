import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum PaymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'Payment transaction ID from payment gateway',
    example: 'txn_1234567890',
  })
  @IsNotEmpty({ message: 'Transaction ID is required' })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.SUCCESS,
  })
  @IsNotEmpty({ message: 'Payment status is required' })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({
    description: 'Subscription ID',
    example: 123,
  })
  @IsNotEmpty({ message: 'Subscription ID is required' })
  subscriptionId: number;

  @ApiProperty({
    description: 'Payment gateway response (for webhook)',
    required: false,
  })
  @IsOptional()
  gatewayResponse?: any;
}
