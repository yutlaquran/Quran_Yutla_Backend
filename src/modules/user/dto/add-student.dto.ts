import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AddStudentDto {
  @ApiProperty({
    description: 'Student email',
    example: 'student@example.com',
  })
  @IsNotEmpty({ message: 'Student email is required' })
  @IsEmail()
  studentEmail: string;
}
