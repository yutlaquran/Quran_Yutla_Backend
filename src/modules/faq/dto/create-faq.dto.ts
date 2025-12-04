import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LanguageEnum } from '../enums/language.emun';

export class CreateFaqDto {
  @ApiProperty({
    description: 'Question text',
    example: 'ما هو تطبيق قرآن يتلى؟',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255, { message: 'Question cannot be longer than 255 characters' })
  question: string;

  @ApiProperty({
    description: 'Answer text',
    example: 'هو تطبيق لتعليم القرآن بشكل تفاعلي',
  })
  @IsNotEmpty()
  @IsString()
  answer: string;

  @ApiProperty({
    description: 'Is FAQ active',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Sort order',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  sortOrder: number;

  @ApiProperty({
    description: 'Language',
    enum: LanguageEnum,
    example: LanguageEnum.AR,
    default: 'ar',
  })
  @IsNotEmpty()
  @IsEnum(LanguageEnum, {
    message: 'Language must be either "ar" or "en"',
  })
  language: LanguageEnum;
}
