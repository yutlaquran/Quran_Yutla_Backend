import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Plan ID',
    example: 1,
  })
  @IsNotEmpty({ message: 'Plan ID is required' })
  @IsNumber()
  planId: number;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'visa',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Auto-renew subscription',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}
