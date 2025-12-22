import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class TeacherEvaluationDto {
  @ApiProperty({
    description: 'Manual evaluation score from teacher (0-100)',
    example: 85.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0, { message: 'Score must be at least 0' })
  @Max(100, { message: 'Score must not exceed 100' })
  score: number;

  @ApiPropertyOptional({
    description: 'Teacher notes and feedback for the student',
    example:
      'Excellent recitation overall. Please work on tajweed rules for the letter ق (Qaf). Keep practicing!',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
