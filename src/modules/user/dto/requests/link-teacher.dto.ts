import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class LinkTeacherDto {
  @ApiProperty({
    description: 'Student ID to link with teacher',
    example: 123,
  })
  @IsNotEmpty({ message: 'Student ID is required' })
  @IsNumber({}, { message: 'Student ID must be a number' })
  @IsPositive({ message: 'Student ID must be a positive number' })
  studentId: number;
}
