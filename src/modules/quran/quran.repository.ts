import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AyahEntity, SurahEntity } from './entities';

@Injectable()
export class QuranRepository {
  constructor(
    @InjectRepository(AyahEntity)
    private readonly ayahRepository: Repository<AyahEntity>,
    @InjectRepository(SurahEntity)
    private readonly surahRepository: Repository<SurahEntity>,
  ) {}

  async getAyahByNumber(number: number): Promise<AyahEntity | null> {
    return this.ayahRepository.findOne({
      where: { number },
      relations: ['surah'],
    });
  }

  async getAyahBySurahAndNumber(
    surahNumber: number,
    numberInSurah: number,
  ): Promise<AyahEntity | null> {
    return this.ayahRepository.findOne({
      where: {
        surahNumber,
        numberInSurah,
      },
      relations: ['surah'],
    });
  }

  async getSurahByNumber(number: number): Promise<SurahEntity | null> {
    return this.surahRepository.findOne({
      where: { number },
      relations: ['ayahs'],
    });
  }

  async getJuzAyahs(juzNumber: number): Promise<AyahEntity[]> {
    return this.ayahRepository.find({
      where: { juz: juzNumber },
      relations: ['surah'],
      order: { number: 'ASC' },
    });
  }

  async getSurahAyahs(surahNumber: number): Promise<AyahEntity[]> {
    return this.ayahRepository.find({
      where: { surahNumber },
      relations: ['surah'],
      order: { numberInSurah: 'ASC' },
    });
  }

  async getPageAyahs(pageNumber: number): Promise<AyahEntity[]> {
    return this.ayahRepository.find({
      where: { page: pageNumber },
      relations: ['surah'],
      order: { number: 'ASC' },
    });
  }

  async searchAyahs(
    keyword: string,
    surahNumber?: number,
  ): Promise<AyahEntity[]> {
    const queryBuilder = this.ayahRepository
      .createQueryBuilder('ayah')
      .leftJoinAndSelect('ayah.surah', 'surah')
      .where('ayah.text ILIKE :keyword OR ayah.textEmlaey ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });

    if (surahNumber) {
      queryBuilder.andWhere('ayah.surahNumber = :surahNumber', { surahNumber });
    }

    return queryBuilder.orderBy('ayah.number', 'ASC').getMany();
  }

  async getAllSurahs(): Promise<SurahEntity[]> {
    return this.surahRepository.find({
      order: { number: 'ASC' },
    });
  }
}
