import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { UserStatus } from '../../enums/user-status.enum';

export class UpdateUserServiceDto {
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  @IsEnum(UserStatus, { message: 'validation.IS_ENUM' })
  status: UserStatus;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'validation.MIN', context: { min: 0 } })
  @Max(1000000, { message: 'validation.MAX', context: { max: 1000000 } })
  points?: number;
}
