import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminActionSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Reason for the action (suspend, cancel, etc.)',
    example: 'Payment issue',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
