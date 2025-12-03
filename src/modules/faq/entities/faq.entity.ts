import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LanguageEnum } from '../enums/language.emun';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('faqs')
export class Faq extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: 'ar' })
  language: LanguageEnum;
}
