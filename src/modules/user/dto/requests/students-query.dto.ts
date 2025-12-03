import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class StudentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'validation.STRING' })
  @MaxLength(50, { message: 'validation.MAX_LENGTH' })
  keyword?: string;
}
