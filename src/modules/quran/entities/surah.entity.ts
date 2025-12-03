import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Ayah } from './ayah.entity';

@Entity('surahs')
export class Surah extends BaseEntity {
  @PrimaryColumn({ name: 'number' })
  number: number;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'english_name', type: 'varchar', length: 255 })
  englishName: string;

  @Column({
    name: 'english_name_translation',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  englishNameTranslation: string;

  @Column({
    name: 'revelation_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  revelationType: string;

  @Column({ name: 'number_of_ayahs', type: 'int' })
  numberOfAyahs: number;

  @OneToMany(() => Ayah, (ayah) => ayah.surah)
  ayahs: Ayah[];
}

// Also export as SurahEntity for compatibility
export { Surah as SurahEntity };
