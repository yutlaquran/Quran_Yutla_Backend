import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRecitationDto {
  @ApiProperty({
    description: 'Surah ID (1-114)',
    example: 1,
    minimum: 1,
    maximum: 114,
  })
  @IsNotEmpty({ message: 'Surah ID is required' })
  @IsInt()
  @Min(1)
  @Max(114)
  surahId: number;

  @ApiProperty({
    description: 'From Ayah number',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'From Ayah is required' })
  @IsInt()
  @Min(1)
  fromAyah: number;

  @ApiProperty({
    description: 'To Ayah number',
    example: 7,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'To Ayah is required' })
  @IsInt()
  @Min(1)
  toAyah: number;

  @ApiPropertyOptional({
    description: 'Optional notes',
    example: 'First attempt at Surah Al-Fatiha',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
