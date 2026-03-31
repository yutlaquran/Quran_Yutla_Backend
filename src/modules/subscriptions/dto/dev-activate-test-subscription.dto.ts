import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class DevActivateTestSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Optional active plan ID to use for test activation',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  planId?: number;
}
