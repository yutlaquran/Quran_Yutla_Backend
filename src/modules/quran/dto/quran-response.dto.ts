import { PaginatedResponseDto } from '../../../common/dto/pagination-metadata.response.dto';
import { AyahDto } from './ayah.dto';
import { EditionDto } from './edition.dto';
import { SurahDto, SurahListItemDto } from './surah.dto';

export class JuzResponseDto {
  number: number;
  ayahs: AyahDto[];
  surahs: Record<string, SurahDto>;
  edition: EditionDto;
}

export class PaginatedJuzResponseDto extends PaginatedResponseDto<AyahDto> {
  juzInfo: {
    number: number;
    surahs: Record<string, SurahDto>;
    edition: EditionDto;
  };
}

export class SurahResponseDto {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: AyahDto[];
  edition: EditionDto;
}

export class PaginatedSurahResponseDto extends PaginatedResponseDto<AyahDto> {
  surahInfo: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
    edition: EditionDto;
  };
}

export class PaginatedSurahsListResponseDto extends PaginatedResponseDto<SurahListItemDto> {
  // Paginated list of all surahs
}

export class AyahResponseDto {
  number: number;
  text: string;
  edition: EditionDto;
  surah: SurahDto;
  numberInSurah: number;
  juz: number;
  page: number;
  hizbQuarter: number;
  sajda: boolean;
}

export class SearchMatchDto {
  number: number;
  text: string;
  edition: EditionDto;
  surah: SurahDto;
  numberInSurah: number;
}

export class SearchResponseDto {
  count: number;
  matches: SearchMatchDto[];
}

export class PaginatedSearchResponseDto extends PaginatedResponseDto<SearchMatchDto> {
  totalMatches: number;
}
