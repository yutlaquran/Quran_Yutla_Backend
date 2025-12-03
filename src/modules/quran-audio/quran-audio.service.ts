import { Injectable, BadRequestException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { CustomI18nService } from 'src/common/services/custom-i18n.service';
import { GetAudioLinksDto, GetSingleAyahAudioDto, getSingleSurahAudioDto, PaginationQueryDto } from './dto/audio-request.dto';
import { QuranReciter, QuranReciterArabic, QuranReciterEnglish } from './enums/reciter.enum';
import { QuranService } from '../quran/quran.service';

@Injectable()
export class QuranAudioService {
  private readonly AUDIO_BASE_URL_128 = 'https://cdn.islamic.network/quran/audio/128';
  private readonly AUDIO_BASE_URL_64 = 'https://cdn.islamic.network/quran/audio/64';
  
  // Static data for fast calculations - faster than API calls
  private readonly SURAH_AYAH_COUNTS = [
    7, 285, 199, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 226, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
    54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
    14, 11, 11, 18, 12, 12, 30, 52, 44, 56, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
    29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
    11, 8, 3, 8, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
  ];

  constructor(
    private readonly i18n: CustomI18nService,
    private readonly quranService: QuranService,
  ) {}


  private getAudioBaseUrl(reciter: QuranReciter): string {
    // Use 64kbps for Abdul Samad and Minshawi Mujawwad
    const use64kbps = [
      QuranReciter.ABDUL_SAMAD,
      QuranReciter.MINSHAWI_MUJAWWAD
    ].includes(reciter);
    
    return use64kbps ? this.AUDIO_BASE_URL_64 : this.AUDIO_BASE_URL_128;
  }

  private validateSurahNumber(surahNumber: number): void {
    if (surahNumber < 1 || surahNumber > 114) {
      throw new BadRequestException(this.i18n.t('quran.INVALID_SURAH_NUMBER'));
    }
  }

  private validateReciter(reciter: QuranReciter): void {
    if (!Object.values(QuranReciter).includes(reciter)) {
      throw new BadRequestException(this.i18n.t('quran.INVALID_RECITER'));
    }
  }
  private async handleError(error: any, dto: any, fallbackMessage: string): Promise<never> {
    if (error instanceof BadRequestException) {
      throw error;
    }
    if (error instanceof Error) {
      this.validateSurahNumber(dto.surahNumber);
      const surahName = await this.getSurahName(dto.surahNumber);
      const maxAyah = this.getSurahAyahCount(dto.surahNumber)
      const message = `Invalid ayah range for surah ${surahName.english}. Must be between 1 and ${maxAyah}`;
      throw new BadRequestException(message);
    }
    throw new BadRequestException(this.i18n.t(fallbackMessage));
  }
  async getAudioLinks(dto: GetAudioLinksDto) {
    try {
      this.validateSurahNumber(dto.surahNumber);
      this.validateReciter(dto.reciter);
      await this.validateAyahRange(dto.surahNumber, dto.startAyah, dto.endAyah);

      const audioLinks: string[] = [];
      const ayahCount = dto.endAyah - dto.startAyah + 1;

      for (let ayahNum = dto.startAyah; ayahNum <= dto.endAyah; ayahNum++) {
        const globalIndex = await this.getGlobalAyahIndex(dto.surahNumber, ayahNum);
        const audioUrl = `${this.getAudioBaseUrl(dto.reciter)}/${dto.reciter}/${globalIndex}.mp3`;
        audioLinks.push(audioUrl);
      }

      const surahName = await this.getSurahName(dto.surahNumber);
      const ayahCount_ = this.getSurahAyahCount(dto.surahNumber);

      const surahInfo = {
        number: dto.surahNumber,
        name: surahName.arabic,
        englishName: surahName.english,
        numberOfAyahs: ayahCount_
      };

      return {
        audioLinks,
        surahInfo,
        ayahRange: { start: dto.startAyah, end: dto.endAyah, count: ayahCount },
        reciterInfo: this.getReciterInfo(dto.reciter)
      };

    } catch (error) {
      await this.handleError(error, dto, 'quran.AUDIO_GENERATION_FAILED');
    }
  }

  async getSingleAyahAudio(dto: GetSingleAyahAudioDto) {
    try {
      this.validateSurahNumber(dto.surahNumber);
      this.validateReciter(dto.reciter);
      await this.validateAyahRange(dto.surahNumber, dto.ayahNumber, dto.ayahNumber);

      const globalIndex = await this.getGlobalAyahIndex(dto.surahNumber, dto.ayahNumber);
      const audioUrl = `${this.getAudioBaseUrl(dto.reciter)}/${dto.reciter}/${globalIndex}.mp3`;

      const surahName = await this.getSurahName(dto.surahNumber);

      const surahInfo = {
        name: surahName.arabic,
        englishName: surahName.english
      };

      return {
        audioUrl,
        ayahInfo: { surahNumber: dto.surahNumber, ayahNumber: dto.ayahNumber, globalIndex },
        surahInfo,
        reciterInfo: this.getReciterInfo(dto.reciter)
      };

    } catch (error) {
      await this.handleError(error, dto, 'quran.AYAH_AUDIO_FAILED');
    }
  }

  async getAvailableReciters(paginationQuery: PaginationQueryDto) {
    const reciters = Object.values(QuranReciter).map((identifier) => 
      this.getReciterInfo(identifier as QuranReciter)
    );

    const page = paginationQuery.page || 1;
    const limit = paginationQuery.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedReciters = reciters.slice(startIndex, endIndex);

    return {
      total: reciters.length,
      page,
      limit,
      reciters: paginatedReciters
    };
  }

  private getReciterInfo(reciter: QuranReciter) {
    const reciterData = {
      [QuranReciter.ABDUL_SAMAD]: { ar: QuranReciterArabic.ABDUL_SAMAD, en: QuranReciterEnglish.ABDUL_SAMAD },
      [QuranReciter.HUSARY]: { ar: QuranReciterArabic.HUSARY, en: QuranReciterEnglish.HUSARY },
      [QuranReciter.HUSARY_MUJAWWAD]: { ar: QuranReciterArabic.HUSARY_MUJAWWAD, en: QuranReciterEnglish.HUSARY_MUJAWWAD },
      [QuranReciter.MUHAMMAD_JIBREEL]: { ar: QuranReciterArabic.MUHAMMAD_JIBREEL, en: QuranReciterEnglish.MUHAMMAD_JIBREEL },
      [QuranReciter.MINSHAWI]: { ar: QuranReciterArabic.MINSHAWI, en: QuranReciterEnglish.MINSHAWI },
      [QuranReciter.MINSHAWI_MUJAWWAD]: { ar: QuranReciterArabic.MINSHAWI_MUJAWWAD, en: QuranReciterEnglish.MINSHAWI_MUJAWWAD }
    };

    const data = reciterData[reciter];
    return {
      identifier: reciter,
      arabicName: data?.ar || 'Unknown Reciter',
      englishName: data?.en || 'Unknown Reciter'
    };
  }
  async getSingleSurahAudio(dto: getSingleSurahAudioDto) {
    try {
      this.validateSurahNumber(dto.surahNumber);

      const selectedReciter = dto.reciter || QuranReciter.HUSARY;
      this.validateReciter(selectedReciter);

      const surahAyahCount = this.getSurahAyahCount(dto.surahNumber);

      const audioLinks: string[] = [];
      for (let ayahNum = 1; ayahNum <= surahAyahCount; ayahNum++) {
        const globalIndex = await this.getGlobalAyahIndex(dto.surahNumber, ayahNum);
        const audioUrl = `${this.getAudioBaseUrl(selectedReciter)}/${selectedReciter}/${globalIndex}.mp3`;
        audioLinks.push(audioUrl);
      }
      const surahName = await this.getSurahName(dto.surahNumber);
      const surahInfo = {
        number: dto.surahNumber,
        name: surahName.arabic,
        englishName: surahName.english,
        numberOfAyahs: surahAyahCount
      };

      return {
        audioLinks,
        surahInfo,
        reciterInfo: this.getReciterInfo(selectedReciter)
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(this.i18n.t('quran.SURAH_AUDIO_FAILED'));
    }
  }

  // Helper methods using QuranService for names only, static data for calculations
  private getSurahAyahCount(surahNumber: number): number {
    if (surahNumber < 1 || surahNumber > 114) {
      throw new BadRequestException(this.i18n.t('quran.INVALID_SURAH_NUMBER_WITH_ID', { surahNumber }));
    }
    // Use static data to get ayah count quickly
    return this.SURAH_AYAH_COUNTS[surahNumber - 1];
  }

  private async getSurahName(surahNumber: number): Promise<{ arabic: string; english: string }> {
    try {
      // Use getAyah for the first ayah to get surah names from API
      const globalIndex = this.getGlobalAyahIndexFast(surahNumber, 1);
      const ayahResponse = await this.quranService.getAyah(globalIndex, 'ar');
      return {
        arabic: ayahResponse.surah.name,
        english: ayahResponse.surah.englishName
      };
    } catch (error) {
      throw new BadRequestException(this.i18n.t('quran.FAILED_TO_GET_SURAH_NAME', { surahNumber }));
    }
  }

  private getGlobalAyahIndexFast(surahNumber: number, ayahNumber: number): number {
    if (surahNumber < 1 || surahNumber > 114) {
      throw new Error('Surah number must be between 1 and 114');
    }

    const maxAyahs = this.SURAH_AYAH_COUNTS[surahNumber - 1];
    if (ayahNumber < 1 || ayahNumber > maxAyahs) {
      throw new Error(`Ayah number must be between 1 and ${maxAyahs} for surah ${surahNumber}`);
    }

    let globalIndex = 0;
    
    // Sum ayah counts of previous surahs from the static array
    for (let i = 0; i < surahNumber - 1; i++) {
      globalIndex += this.SURAH_AYAH_COUNTS[i];
    }
    
    // Add the ayah number in the current surah
    globalIndex += ayahNumber - 1;
    
    return globalIndex + 1;
  }

  private async getGlobalAyahIndex(surahNumber: number, ayahNumber: number): Promise<number> {
    // Use fast calculation with static data
    return this.getGlobalAyahIndexFast(surahNumber, ayahNumber);
  }

  private async validateAyahRange(surahNumber: number, startAyah: number, endAyah: number): Promise<void> {
    if (surahNumber < 1 || surahNumber > 114) {
      throw new Error('Surah number must be between 1 and 114');
    }

    // Use static data for fast validation
    const maxAyahs = this.SURAH_AYAH_COUNTS[surahNumber - 1];
    
    if (startAyah < 1 || startAyah > maxAyahs) {
      throw new Error(`Start ayah number must be between 1 and ${maxAyahs}`);
    }
    
    if (endAyah < 1 || endAyah > maxAyahs) {
      throw new Error(`End ayah number must be between 1 and ${maxAyahs}`);
    }
    
    if (startAyah > endAyah) {
      throw new Error('Start ayah number must be less than or equal to end ayah number');
    }
  }
}