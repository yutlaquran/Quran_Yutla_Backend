import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuranQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Language code for Quran text',
    example: 'ar',
    default: 'ar',
  })
  @IsOptional()
  @IsString()
  language?: string = 'ar'; // Default to Arabic, can be 'ar', 'en.asad', etc.
}

export class JuzQueryDto extends QuranQueryDto {
  // Inherits language, offset, limit from QuranQueryDto
}

export class SurahQueryDto extends QuranQueryDto {
  // Inherits language, offset, limit from QuranQueryDto
}



export class SearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Language code for Quran text',
    example: 'ar',
    default: 'ar',
  })
  @IsOptional()
  @IsString()
  language?: string = 'ar'; // Default to Arabic

  @ApiPropertyOptional({
    description: 'Surah to search in',
    example: 'all',
    default: 'all',
  })
  @IsOptional()
  @IsString()
  surah?: string = 'all'; // Default to search all surahs
}
