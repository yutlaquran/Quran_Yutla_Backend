import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({
    description: 'Plan ID to subscribe to',
    example: 1,
  })
  @IsNotEmpty({ message: 'Plan ID is required' })
  @IsNumber()
  planId: number;

  @ApiPropertyOptional({
    description: 'Auto-renew subscription',
    example: true,
    default: false,
  })
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({
    description: 'Success callback URL (for mobile apps)',
    example: 'myapp://payment/success',
  })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Failure callback URL (for mobile apps)',
    example: 'myapp://payment/failed',
  })
  @IsOptional()
  @IsString()
  failureUrl?: string;
}
