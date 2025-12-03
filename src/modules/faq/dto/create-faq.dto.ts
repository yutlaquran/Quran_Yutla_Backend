import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { LanguageEnum } from '../enums/language.emun';

export class CreateFaqDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255, { message: 'Question cannot be longer than 255 characters' })
  question: string;

  @IsNotEmpty()
  @IsString()
  answer: string;

  @IsBoolean()
  isActive: boolean;

  @IsNotEmpty()
  @IsNumber()
  sortOrder: number;

  @IsNotEmpty()
  @IsEnum(LanguageEnum, {
    message: 'Language must be either "ar" or "en"',
  })
  language: LanguageEnum;
}
