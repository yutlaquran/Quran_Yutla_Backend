import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class metadataDto {
  @IsNumber()
  totalItems: number;

  @IsNumber()
  itemsPerPage: number;

  @IsNumber()
  totalPages: number;

  @IsNumber()
  currentPage: number;
}

export class linksDto {
  @IsOptional()
  hasNext: boolean;

  @IsString()
  @IsOptional()
  first?: string;

  @IsString()
  @IsOptional()
  previous?: string;

  @IsString()
  @IsOptional()
  next?: string;

  @IsString()
  @IsOptional()
  last?: string;
}

export class PaginatedResponseDto<T> {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object as unknown as () => T)
  items: T[];

  @ValidateNested()
  metadata: metadataDto;

  @ValidateNested()
  links: linksDto;
}
