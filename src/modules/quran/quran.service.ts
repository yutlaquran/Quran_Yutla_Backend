import { Injectable } from '@nestjs/common';
import {
  JuzQueryDto,
  SearchQueryDto,
  SurahQueryDto,
  SurahsListQueryDto,
} from './dto/query.dto';
import {
  AyahResponseDto,
  JuzResponseDto,
  PaginatedJuzResponseDto,
  PaginatedSearchResponseDto,
  PaginatedSurahResponseDto,
  SearchResponseDto,
  SurahResponseDto,
} from './dto/quran-response.dto';
import { QuranDataService } from './quran-data.service';

@Injectable()
export class QuranService {
  constructor(private readonly quranDataService: QuranDataService) {}

  /**
   * Get a specific Juz (Para) of the Quran with pagination
   * @param juzNumber - Juz number (1-30)
   * @param query - Query parameters (language, page, limit)
   * @returns PaginatedJuzResponseDto
   */
  async getJuz(
    juzNumber: number,
    query: JuzQueryDto,
  ): Promise<PaginatedJuzResponseDto> {
    return this.quranDataService.getJuz(juzNumber, query);
  }

  /**
   * Get a specific Juz (Para) of the Quran without pagination
   * @param juzNumber - Juz number (1-30)
   * @param language - Language edition (default: 'ar')
   * @returns JuzResponseDto
   */
  async getJuzComplete(
    juzNumber: number,
    language: string = 'ar',
  ): Promise<JuzResponseDto> {
    return this.quranDataService.getJuzComplete(juzNumber, language);
  }

  /**
   * Get a specific Surah of the Quran with pagination
   * @param surahNumber - Surah number (1-114)
   * @param query - Query parameters (language, page, limit)
   * @returns PaginatedSurahResponseDto
   */
  async getSurah(
    surahNumber: number,
    query: SurahQueryDto,
  ): Promise<PaginatedSurahResponseDto> {
    return this.quranDataService.getSurah(surahNumber, query);
  }

  /**
   * Get a specific Surah of the Quran without pagination
   * @param surahNumber - Surah number (1-114)
   * @param language - Language edition (default: 'ar')
   * @returns SurahResponseDto
   */
  async getSurahComplete(
    surahNumber: number,
    language: string = 'ar',
  ): Promise<SurahResponseDto> {
    return this.quranDataService.getSurahComplete(surahNumber, language);
  }

  /**
   * Get a specific Ayah of the Quran
   * @param ayahNumber - Ayah number (1-6236)
   * @param language - Language edition (default: 'ar')
   * @returns AyahResponseDto
   */
  async getAyah(
    ayahNumber: number,
    language: string = 'ar',
  ): Promise<AyahResponseDto> {
    return this.quranDataService.getAyah(ayahNumber, language);
  }

  /**
   * Get a specific page of the Quran
   * @param pageNumber - Page number (1-604)
   * @param language - Language edition (default: 'ar')
   * @returns Page response with ayahs
   */
  async getPage(pageNumber: number, language: string = 'ar') {
    return this.quranDataService.getPage(pageNumber, language);
  }

  /**
   * Get a specific Ayah of the Quran by Surah and Ayah number
   * @param surahNumber - Surah number (1-114)
   * @param ayahNumber - Ayah number within the surah
   * @param language - Language edition (default: 'ar')
   * @returns AyahResponseDto
   */
  async getAyahBySurahNumber(
    surahNumber: number,
    ayahNumber: number,
    language: string = 'ar',
  ): Promise<AyahResponseDto> {
    return this.quranDataService.getAyahBySurahNumber(
      surahNumber,
      ayahNumber,
      language,
    );
  }

  /**
   * Search for a text in the Quran with pagination
   * @param keyword - Search keyword
   * @param query - Query parameters (language, surah, page, limit)
   * @returns PaginatedSearchResponseDto
   */
  async searchQuran(
    keyword: string,
    query: SearchQueryDto,
  ): Promise<PaginatedSearchResponseDto> {
    return this.quranDataService.searchQuran(keyword, query);
  }

  /**
   * Search for a text in the Quran without pagination
   * @param keyword - Search keyword
   * @param language - Language edition (default: 'ar')
   * @param surah - Surah to search in (default: 'all')
   * @returns SearchResponseDto
   */
  async searchQuranComplete(
    keyword: string,
    language: string = 'ar',
    surah: string = 'all',
  ): Promise<SearchResponseDto> {
    return this.quranDataService.searchQuranComplete(keyword, language, surah);
  }

  /**
   * Get all Surahs with pagination
   * @param query - Query parameters (page, limit)
   * @returns PaginatedSurahsListResponseDto
   */
  async getAllSurahs() {
    return this.quranDataService.getAllSurahs();
  }
}
