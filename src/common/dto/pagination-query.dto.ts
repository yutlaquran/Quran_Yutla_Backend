import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'validation.MIN', context: { min: 1 } })
  @Max(1000, { message: 'validation.MAX', context: { max: 1000 } })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'validation.MIN', context: { min: 1 } })
  @Max(100, { message: 'validation.MAX', context: { max: 100 } })
  limit?: number = 10;

  @IsOptional()
  sortBy?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}
