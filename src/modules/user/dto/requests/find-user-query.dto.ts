import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { RolesEnum } from '../../../../common/enums/roles.enum';
import { UserStatus } from '../../enums/user-status.enum';

export class UserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'validation.STRING' })
  @MaxLength(50, { message: 'validation.MAX_LENGTH' })
  keyword?: string;

  @IsOptional()
  @IsEmail({}, { message: 'validation.EMAIL' })
  @MaxLength(60, { message: 'validation.MAX_LENGTH' })
  email?: string;

  @IsOptional()
  @IsEnum(RolesEnum)
  role?: RolesEnum;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: string;

  @IsOptional()
  @IsString({ message: 'validation.STRING' })
  @MaxLength(50, { message: 'validation.MAX_LENGTH' })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'validation.STRING' })
  @MaxLength(50, { message: 'validation.MAX_LENGTH' })
  fullName?: string;
}
