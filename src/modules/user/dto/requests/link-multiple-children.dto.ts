import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, Length, ArrayMinSize } from 'class-validator';

export class LinkMultipleChildrenDto {
  @ApiProperty({
    description: 'Array of student codes (each 6 characters)',
    example: ['ABC123', 'XYZ789'],
    type: [String],
  })
  @IsNotEmpty({ message: 'Student codes are required' })
  @IsArray({ message: 'Student codes must be an array' })
  @ArrayMinSize(1, { message: 'At least one student code is required' })
  @IsString({ each: true, message: 'Each student code must be a string' })
  @Length(6, 6, { each: true, message: 'Each student code must be exactly 6 characters' })
  studentCodes: string[];
}
