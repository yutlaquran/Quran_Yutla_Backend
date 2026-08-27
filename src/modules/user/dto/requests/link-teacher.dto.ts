import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LinkTeacherDto {
  @ApiProperty({
    description: 'Student unique code (6 digits)',
    example: '123456',
  })
  @IsNotEmpty({ message: 'Student code is required' })
  @IsString()
  @Length(6, 6, { message: 'Student code must be 6 digits' })
  studentCode: string;
}
