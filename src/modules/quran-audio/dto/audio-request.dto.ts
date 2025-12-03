import { IsEnum, IsNumber, Min, Max, IsOptional, IsNumberString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { QuranReciter } from '../enums/reciter.enum';

export class GetAudioLinksDto {
  @IsNumber()
  @Min(1)
  @Max(114)
  surahNumber: number;
  @IsNumber()
  @Min(1)
  startAyah: number;
  @IsNumber()
  @Min(1)
  endAyah: number;
  @IsEnum(QuranReciter)
  reciter: QuranReciter;
}

export class GetSingleAyahAudioDto {
  @IsNumber()
  @Min(1)
  @Max(114)
  surahNumber: number;
  @IsNumber()
  @Min(1)
  ayahNumber: number;
  @IsEnum(QuranReciter)
  reciter: QuranReciter;
}

export class getSingleSurahAudioDto {
  @IsNumber()
  @Min(1)
  @Max(114)
  surahNumber: number;
  @IsEnum(QuranReciter)
  reciter?: QuranReciter;
}
export class PaginationQueryDto {

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}