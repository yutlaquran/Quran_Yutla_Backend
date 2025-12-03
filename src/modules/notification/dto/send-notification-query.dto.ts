import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class NotificationQueryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100, { message: 'Cannot specify more than 100 governorates.' })
  @MaxLength(50, {
    each: true,
    message: 'Each governorate name cannot be longer than 50 characters.',
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    // Handle comma-separated values or single value
    return value ? value.split(',').map((item: string) => item.trim()) : [];
  })
  governorates?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [Number(value)] : [];
  })
  roles?: number[];
}
