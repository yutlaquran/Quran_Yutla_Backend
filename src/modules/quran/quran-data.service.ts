import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  linksDto,
  metadataDto,
} from '../../common/dto/pagination-metadata.response.dto';
import {
  AyahDto,
  AyahResponseDto,
  EditionDto,
  JuzQueryDto,
  JuzResponseDto,
  PaginatedJuzResponseDto,
  PaginatedSearchResponseDto,
  PaginatedSurahResponseDto,
  SearchQueryDto,
  SearchResponseDto,
  SurahDto,
  SurahListItemDto,
  SurahQueryDto,
  SurahResponseDto,
} from './dto';
import { AyahEntity, SurahEntity } from './entities';
import { QuranRepository } from './quran.repository';
import { CustomI18nService } from 'src/common/services/custom-i18n.service';

@Injectable()
export class QuranDataService {
  constructor(
    private readonly quranRepository: QuranRepository,
    private readonly i18n: CustomI18nService,
  ) {}

  /**
   * Create pagination metadata
   */
  private createPaginationMetadata(
    page: number,
    limit: number,
    totalItems: number,
  ): metadataDto {
    const totalPages = Math.ceil(totalItems / limit);

    return {
      totalItems,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };
  }

  /**
   * Create pagination links
   */
  private createPaginationLinks(
    page: number,
    limit: number,
    totalPages: number,
    baseUrl: string,
    additionalParams: Record<string, string> = {},
  ): linksDto {
    const createUrl = (pageNum: number) => {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        ...additionalParams,
      });
      return `${baseUrl}?${params.toString()}`;
    };

    return {
      hasNext: page < totalPages,
      first: totalPages > 0 ? createUrl(1) : undefined,
      previous: page > 1 ? createUrl(page - 1) : undefined,
      next: page < totalPages ? createUrl(page + 1) : undefined,
      last: totalPages > 0 ? createUrl(totalPages) : undefined,
    };
  }

  /**
   * Paginate array data
   */
  private paginateArray<T>(
    data: T[],
    page: number,
    limit: number,
  ): { items: T[]; totalItems: number } {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      items: data.slice(startIndex, endIndex),
      totalItems: data.length,
    };
  }

  /**
   * Get a specific Juz (Para) of the Quran with pagination from database
   */
  async getJuz(
    juzNumber: number,
    query: JuzQueryDto,
  ): Promise<PaginatedJuzResponseDto> {
    // Validate juz number
    if (juzNumber < 1 || juzNumber > 30) {
      throw new HttpException(
        this.i18n.t('quran.INVALID_JUZ_NUMBER'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 10;

    const juzAyahs = await this.quranRepository.getJuzAyahs(juzNumber);

    if (juzAyahs.length === 0) {
      throw new HttpException(
        this.i18n.t('quran.JUZ_NOT_FOUND', { juzNumber }),
        HttpStatus.NOT_FOUND,
      );
    }

    // Apply pagination to ayahs
    const paginatedAyahs = this.paginateArray(juzAyahs, page, limit);

    // Create pagination metadata and links
    const metadata = this.createPaginationMetadata(
      page,
      limit,
      paginatedAyahs.totalItems,
    );
    const links = this.createPaginationLinks(
      page,
      limit,
      metadata.totalPages,
      `/quran/juz/${juzNumber}`,
      { language: query.language || 'ar' },
    );

    // Group surahs from ayahs
    const surahs: Record<string, SurahDto> = {};
    juzAyahs.forEach((ayah) => {
      if (ayah.surah && !surahs[ayah.surah.number]) {
        surahs[ayah.surah.number] = this.mapToSurahDto(ayah.surah);
      }
    });

    return {
      items: paginatedAyahs.items.map((ayah) => this.mapToAyahDto(ayah)),
      metadata,
      links,
      juzInfo: {
        number: juzNumber,
        surahs,
        edition: this.getDefaultEdition(),
      },
    };
  }

  /**
   * Get a specific Juz (Para) of the Quran without pagination from database
   */
  async getJuzComplete(
    juzNumber: number,
    language: string = 'ar',
  ): Promise<JuzResponseDto> {
    // Validate juz number
    if (juzNumber < 1 || juzNumber > 30) {
      throw new HttpException(
        this.i18n.t('quran.INVALID_JUZ_NUMBER'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const juzAyahs = await this.quranRepository.getJuzAyahs(juzNumber);

    if (juzAyahs.length === 0) {
      throw new HttpException(
        this.i18n.t('quran.JUZ_NOT_FOUND', { juzNumber }),
        HttpStatus.NOT_FOUND,
      );
    }

    // Group surahs from ayahs
    const surahs: Record<string, SurahDto> = {};
    juzAyahs.forEach((ayah) => {
      if (ayah.surah && !surahs[ayah.surah.number]) {
        surahs[ayah.surah.number] = this.mapToSurahDto(ayah.surah);
      }
    });

    return {
      number: juzNumber,
      ayahs: juzAyahs.map((ayah) => this.mapToAyahDto(ayah)),
      surahs,
      edition: this.getDefaultEdition(),
    };
  }

  /**
   * Get a specific Surah of the Quran with pagination from database
   */
  async getSurah(
    surahNumber: number,
    query: SurahQueryDto,
  ): Promise<PaginatedSurahResponseDto> {
    // Validate surah number
    if (surahNumber < 1 || surahNumber > 114) {
      throw new HttpException(
        this.i18n.t('quran.INVALID_SURAH_NUMBER'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 10;

    const surah = await this.quranRepository.getSurahByNumber(surahNumber);

    if (!surah) {
      throw new HttpException(
        this.i18n.t('quran.SURAH_NOT_FOUND', { surahNumber }),
        HttpStatus.NOT_FOUND,
      );
    }

    const surahAyahs = await this.quranRepository.getSurahAyahs(surahNumber);

    // Apply pagination to ayahs
    const paginatedAyahs = this.paginateArray(surahAyahs, page, limit);

    // Create pagination metadata and links
    const metadata = this.createPaginationMetadata(
      page,
      limit,
      paginatedAyahs.totalItems,
    );
    const links = this.createPaginationLinks(
      page,
      limit,
      metadata.totalPages,
      `/quran/surah/${surahNumber}`,
      { language: query.language || 'ar' },
    );

    return {
      items: paginatedAyahs.items.map((ayah) => this.mapToAyahDto(ayah)),
      metadata,
      links,
      surahInfo: {
        number: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        englishNameTranslation: surah.englishNameTranslation || '',
        revelationType: surah.revelationType || '',
        numberOfAyahs: surah.numberOfAyahs,
        edition: this.getDefaultEdition(),
      },
    };
  }

  /**
   * Get a specific Surah of the Quran without pagination from database
   */
  async getSurahComplete(
    surahNumber: number,
    language: string = 'ar',
  ): Promise<SurahResponseDto> {
    // Validate surah number
    if (surahNumber < 1 || surahNumber > 114) {
      throw new HttpException(
        this.i18n.t('quran.INVALID_SURAH_NUMBER'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const surah = await this.quranRepository.getSurahByNumber(surahNumber);

    if (!surah) {
      throw new HttpException(
        this.i18n.t('quran.SURAH_NOT_FOUND', { surahNumber }),
        HttpStatus.NOT_FOUND,
      );
    }

    const surahAyahs = await this.quranRepository.getSurahAyahs(surahNumber);

    return {
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation || '',
      revelationType: surah.revelationType || '',
      numberOfAyahs: surah.numberOfAyahs,
      ayahs: surahAyahs.map((ayah) => this.mapToAyahDto(ayah)),
      edition: this.getDefaultEdition(),
    };
  }

  /**
   * Get a specific Ayah of the Quran from database
   */
  async getAyah(
    ayahNumber: number,
    language: string = 'ar',
  ): Promise<AyahResponseDto> {
    // Validate ayah number
    if (ayahNumber < 1 || ayahNumber > 6236) {
      throw new HttpException(
        this.i18n.t('quran.INVALID_AYAH_NUMBER'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const ayah = await this.quranRepository.getAyahByNumber(ayahNumber);

    if (!ayah) {
      throw new HttpException(
        this.i18n.t('quran.AYAH_NOT_FOUND', { ayahNumber }),
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapToAyahResponseDto(ayah);
  }

  /**
   * Get a specific page of the Quran from database
   */
  async getPage(pageNumber: number, language: string = 'ar') {
    // Validate page number
    if (pageNumber < 1 || pageNumber > 604) {
      throw new HttpException(
        this.i18n.t('quran.INVALID_PAGE_NUMBER'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const ayahs = await this.quranRepository.getPageAyahs(pageNumber);

    if (!ayahs || ayahs.length === 0) {
      throw new HttpException(
        this.i18n.t('quran.PAGE_NOT_FOUND', { pageNumber }),
        HttpStatus.NOT_FOUND,
      );
    }

    const edition = this.getDefaultEdition();

    return {
      page: pageNumber,
      ayahs: ayahs.map((ayah) => ({
        number: ayah.number,
        text: ayah.text,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        page: ayah.page,
        hizbQuarter: ayah.hizbQuarter,
        sajda: ayah.sajda,
        surah: {
          number: ayah.surah.number,
          name: ayah.surah.name,
          englishName: ayah.surah.englishName,
          numberOfAyahs: ayah.surah.numberOfAyahs,
        },
      })),
      edition,
    };
  }

  /**
   * Get a specific Ayah by Surah and Ayah number from database
   */
  async getAyahBySurahNumber(
    surahNumber: number,
    ayahNumber: number,
    language: string = 'ar',
  ): Promise<AyahResponseDto> {
    // Validate surah number
    if (surahNumber < 1 || surahNumber > 114) {
      throw new HttpException(
        this.i18n.t('quran.INVALID_SURAH_NUMBER'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const ayah = await this.quranRepository.getAyahBySurahAndNumber(
      surahNumber,
      ayahNumber,
    );

    if (!ayah) {
      throw new HttpException(
        this.i18n.t('quran.AYAH_NOT_FOUND', { ayahNumber }),
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapToAyahResponseDto(ayah);
  }

  /**
   * Search for a text in the Quran with pagination from database
   */
  async searchQuran(
    keyword: string,
    query: SearchQueryDto,
  ): Promise<PaginatedSearchResponseDto> {
    try {
      if (!keyword || keyword.trim().length === 0) {
        throw new HttpException(
          this.i18n.t('quran.SEARCH_KEYWORD_REQUIRED'),
          HttpStatus.BAD_REQUEST,
        );
      }

      const page = query.page || 1;
      const limit = query.limit || 10;
      const surahNumber =
        query.surah && query.surah !== 'all'
          ? parseInt(query.surah)
          : undefined;

      const searchResults = await this.quranRepository.searchAyahs(
        keyword.trim(),
        surahNumber,
      );

      // Apply pagination to search results
      const paginatedResults = this.paginateArray(searchResults, page, limit);

      // Create pagination metadata and links
      const metadata = this.createPaginationMetadata(
        page,
        limit,
        paginatedResults.totalItems,
      );
      const links = this.createPaginationLinks(
        page,
        limit,
        metadata.totalPages,
        `/quran/search`,
        {
          keyword: encodeURIComponent(keyword.trim()),
          language: query.language || 'ar',
          ...(query.surah !== 'all' && { surah: query.surah || '' }),
        },
      );

      return {
        items: paginatedResults.items.map((ayah) => ({
          number: ayah.number,
          text: ayah.text,
          edition: this.getDefaultEdition(),
          surah: this.mapToSurahDto(ayah.surah),
          numberInSurah: ayah.numberInSurah,
        })),
        metadata,
        links,
        totalMatches: searchResults.length,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        this.i18n.t('quran.ERROR_SEARCHING_QURAN'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Search for a text in the Quran without pagination from database
   */
  async searchQuranComplete(
    keyword: string,
    language: string = 'ar',
    surah: string = 'all',
  ): Promise<SearchResponseDto> {
    try {
      if (!keyword || keyword.trim().length === 0) {
        throw new HttpException(
          this.i18n.t('quran.SEARCH_KEYWORD_REQUIRED'),
          HttpStatus.BAD_REQUEST,
        );
      }

      const surahNumber = surah !== 'all' ? parseInt(surah) : undefined;
      const searchResults = await this.quranRepository.searchAyahs(
        keyword.trim(),
        surahNumber,
      );

      return {
        count: searchResults.length,
        matches: searchResults.map((ayah) => ({
          number: ayah.number,
          text: ayah.text,
          edition: this.getDefaultEdition(),
          surah: this.mapToSurahDto(ayah.surah),
          numberInSurah: ayah.numberInSurah,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        this.i18n.t('quran.ERROR_SEARCHING_QURAN'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Map AyahEntity to AyahDto
   */
  private mapToAyahDto(ayah: AyahEntity): AyahDto {
    return {
      number: ayah.number,
      text: ayah.text,
      numberInSurah: ayah.numberInSurah,
      juz: ayah.juz,
      page: ayah.page,
      hizbQuarter: ayah.hizbQuarter || 0,
      ...(ayah.surah && { surah: this.mapToSurahDto(ayah.surah) }),
    };
  }

  /**
   * Get all Surahs with pagination
   * @param query - Query parameters (page, limit)
   * @returns PaginatedSurahsListResponseDto
   */
  async getAllSurahs() {
    // Get all surahs from repository
    const allSurahs = await this.quranRepository.getAllSurahs();

    // Map to DTOs
    const surahItems: SurahListItemDto[] = allSurahs.map((surah) => ({
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation || '',
      revelationType: surah.revelationType || 'Meccan',
      numberOfAyahs: surah.numberOfAyahs,
    }));

    return surahItems;
  }

  /**
   * Map SurahEntity to SurahDto
   */
  private mapToSurahDto(surah: SurahEntity): SurahDto {
    return {
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      numberOfAyahs: surah.numberOfAyahs,
    };
  }

  /**
   * Map AyahEntity to AyahResponseDto
   */
  private mapToAyahResponseDto(ayah: AyahEntity): AyahResponseDto {
    return {
      number: ayah.number,
      text: ayah.text,
      edition: this.getDefaultEdition(),
      surah: this.mapToSurahDto(ayah.surah),
      numberInSurah: ayah.numberInSurah,
      juz: ayah.juz,
      page: ayah.page,
      hizbQuarter: ayah.hizbQuarter || 0,
      sajda: ayah.sajda,
    };
  }

  /**
   * Get default edition for Hafs data
   */
  private getDefaultEdition(): EditionDto {
    return {
      identifier: 'hafs',
      language: 'ar',
      name: 'حفص عن عاصم',
      englishName: 'Hafs from Asim',
      format: 'text',
      type: 'quran',
      direction: 'rtl',
    };
  }
}
