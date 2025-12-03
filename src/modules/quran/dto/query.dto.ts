import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QuranQueryDto extends PaginationQueryDto {
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

export class SurahsListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  language?: string = 'ar'; // Default to Arabic
}

export class SearchQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  language?: string = 'ar'; // Default to Arabic

  @IsOptional()
  @IsString()
  surah?: string = 'all'; // Default to search all surahs
}
