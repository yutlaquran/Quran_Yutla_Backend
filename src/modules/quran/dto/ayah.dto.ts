import { SurahDto } from './surah.dto';

export class AyahDto {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  hizbQuarter: number;
  surah?: SurahDto;
}
