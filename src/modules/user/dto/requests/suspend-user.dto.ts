import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuspendUserDto {
  @ApiPropertyOptional({
    description: 'Reason for suspending the user',
    example: 'Repeated policy violations',
  })
  @IsOptional()
  @IsString({ message: 'validation.STRING' })
  @MaxLength(500, { message: 'validation.MAX_LENGTH', context: { max: 500 } })
  reason?: string;
}
