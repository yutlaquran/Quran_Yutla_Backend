import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Surah } from './surah.entity';

@Entity('ayahs')
export class Ayah extends BaseEntity {
  @PrimaryColumn({ name: 'id' })
  id: number;

  @Column({ name: 'number', type: 'int' })
  number: number;

  @Column({ name: 'text', type: 'text' })
  text: string;

  @Column({ name: 'text_emlaey', type: 'text', nullable: true })
  textEmlaey: string;

  @Column({ name: 'number_in_surah', type: 'int' })
  numberInSurah: number;

  @Column({ name: 'juz', type: 'int' })
  juz: number;

  @Column({ name: 'page', type: 'int' })
  page: number;

  @Column({ name: 'hizb_quarter', type: 'int', nullable: true })
  hizbQuarter: number;

  @Column({ name: 'line_start', type: 'int', nullable: true })
  lineStart: number;

  @Column({ name: 'line_end', type: 'int', nullable: true })
  lineEnd: number;

  @Column({ name: 'sajda', type: 'boolean', default: false })
  sajda: boolean;

  @Column({ name: 'surah_number', type: 'int' })
  surahNumber: number;

  @ManyToOne(() => Surah, (surah) => surah.ayahs)
  @JoinColumn({ name: 'surah_number' })
  surah: Surah;
}

// Also export as AyahEntity for compatibility
export { Ayah as AyahEntity };
