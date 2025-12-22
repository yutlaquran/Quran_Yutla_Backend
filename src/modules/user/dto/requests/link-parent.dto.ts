import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LinkParentDto {
  @ApiProperty({
    description: 'Student unique code (6 characters)',
    example: 'ABC123',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: 'Student code is required' })
  @IsString()
  @Length(6, 6, { message: 'Student code must be exactly 6 characters' })
  studentCode: string;
}
