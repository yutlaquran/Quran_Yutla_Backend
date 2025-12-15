import { Controller, Get, Param, ParseIntPipe, Query, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import {
  JuzQueryDto,
  SearchQueryDto,
  SurahQueryDto,
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
import { QuranService } from './quran.service';

@ApiTags('Quran')
@SkipThrottle()
@Controller({ path: 'quran', version: '1' })
export class QuranController {
  constructor(private readonly quranService: QuranService) {}

  /**
   * GET /quran/surahs
   * Get all Surahs (114 surahs)
   */
  @Get('surahs')
  @ApiOperation({
    summary: 'Get all Surahs',
    description: 'Returns all 114 Surahs of the Quran'
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description: 'Language code for Surah names',
    example: 'ar',
    schema: { default: 'ar' }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All Surahs retrieved successfully'
  })
  @SuccessResponse('quran.FETCH_SURAHS_SUCCESS')
  async getAllSurahs(@Query('language') language?: string) {
    return this.quranService.getAllSurahs(language);
  }

  /**
   * GET /quran/juz/:juzNumber
   * Get a specific Juz (Para) of the Quran with pagination
   */
  @Get('juz/:juzNumber')
  @ApiOperation({
    summary: 'Get specific Juz (1-30)',
  })
  @ApiParam({ name: 'juzNumber', description: 'Juz number (1-30)', example: 1 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Juz retrieved successfully'
  })
  @SuccessResponse('quran.FETCH_JUZ_SUCCESS')
  async getJuz(
    @Param('juzNumber', ParseIntPipe) juzNumber: number,
    @Query() query: JuzQueryDto,
  ): Promise<PaginatedJuzResponseDto> {
    return this.quranService.getJuz(juzNumber, query);
  }

  /**
   * GET /quran/surah/:surahNumber
   * Get a specific Surah of the Quran
   */
  @Get('surah/:surahNumber/ayah/:ayahNumber')
  @SuccessResponse('quran.FETCH_AYAH_SUCCESS')
  async getAyahBySurahNumber(
    @Param('surahNumber', ParseIntPipe) surahNumber: number,
    @Param('ayahNumber', ParseIntPipe) ayahNumber: number,
    @Query('language') language?: string,
  ): Promise<AyahResponseDto> {
    return this.quranService.getAyahBySurahNumber(
      surahNumber,
      ayahNumber,
      language,
    );
  }

  /**
   * GET /quran/surah/:surahNumber
   * Get a specific Surah of the Quran with pagination
   */
  @Get('surah/:surahNumber')
  @SuccessResponse('quran.FETCH_SURAH_SUCCESS')
  async getSurah(
    @Param('surahNumber', ParseIntPipe) surahNumber: number,
    @Query() query: SurahQueryDto,
  ): Promise<PaginatedSurahResponseDto> {
    return this.quranService.getSurah(surahNumber, query);
  }

  /**
   * GET /quran/ayah/:ayahNumber
   * Get a specific Ayah of the Quran
   */
  @Get('ayah/:ayahNumber')
  @SuccessResponse('quran.FETCH_AYAH_SUCCESS')
  async getAyah(
    @Param('ayahNumber', ParseIntPipe) ayahNumber: number,
    @Query('language') language?: string,
  ): Promise<AyahResponseDto> {
    return this.quranService.getAyah(ayahNumber, language);
  }

  /**
   * GET /quran/page/:pageNumber
   * Get a specific page of the Quran
   */
  @Get('page/:pageNumber')
  @ApiOperation({
    summary: 'Get specific page (1-604)',
  })
  @ApiParam({ name: 'pageNumber', description: 'Page number (1-604)', example: 1 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page retrieved successfully'
  })
  @SuccessResponse('quran.FETCH_PAGE_SUCCESS')
  async getPage(
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Query('language') language?: string,
  ) {
    return this.quranService.getPage(pageNumber, language);
  }

  /**
   * GET /quran/search/:keyword
   * Search for a text in the Quran with pagination
   */
  @Get('search/:keyword')
  @SuccessResponse('quran.FETCH_SEARCH_SUCCESS')
  async searchQuran(
    @Param('keyword') keyword: string,
    @Query() query: SearchQueryDto,
  ): Promise<PaginatedSearchResponseDto> {
    return this.quranService.searchQuran(keyword, query);
  }

  /**
   * GET /quran/juz/:juzNumber/complete
   * Get a complete Juz (Para) of the Quran without pagination
   */
  @Get('juz/:juzNumber/complete')
  @SuccessResponse('quran.FETCH_JUZ_SUCCESS')
  async getJuzComplete(
    @Param('juzNumber', ParseIntPipe) juzNumber: number,
    @Query('language') language?: string,
  ): Promise<JuzResponseDto> {
    return this.quranService.getJuzComplete(juzNumber, language);
  }

  /**
   * GET /quran/surah/:surahNumber/complete
   * Get a complete Surah of the Quran without pagination
   */
  @Get('surah/:surahNumber/complete')
  @SuccessResponse('quran.FETCH_SURAH_SUCCESS')
  async getSurahComplete(
    @Param('surahNumber', ParseIntPipe) surahNumber: number,
    @Query('language') language?: string,
  ): Promise<SurahResponseDto> {
    return this.quranService.getSurahComplete(surahNumber, language);
  }

  /**
   * GET /quran/search/:keyword/complete
   * Search for a text in the Quran without pagination
   */
  @Get('search/:keyword/complete')
  @SuccessResponse('quran.FETCH_SEARCH_SUCCESS')
  async searchQuranComplete(
    @Param('keyword') keyword: string,
    @Query('language') language?: string,
    @Query('surah') surah?: string,
  ): Promise<SearchResponseDto> {
    return this.quranService.searchQuranComplete(keyword, language, surah);
  }
}
