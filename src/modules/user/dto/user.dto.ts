import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UserStatus } from '../enums/user-status.enum';

export class UserDto {
  @ApiProperty()
  @IsNumber()
  @Min(1, { message: 'validation.MIN' })
  id: number;

  @ApiProperty()
  @IsEmail({}, { message: 'validation.EMAIL' })
  @MaxLength(255, { message: 'validation.MAX_LENGTH' })
  email: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100, {
    message: 'validation.MAX_LENGTH',
  })
  fullName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20, {
    message: 'validation.MAX_LENGTH',
  })
  nationalId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50, {
    message: 'validation.MAX_LENGTH',
  })
  membershipId: string;

  @ApiProperty()
  @IsEnum(UserStatus, { message: 'validation.ENUM' })
  status: UserStatus;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsNumber({}, { message: 'validation.MUST_BE_NUMBER' })
  @Min(0, { message: 'validation.MIN', context: { min: 0 } })
  @Max(1000000, { message: 'validation.MAX', context: { max: 1000000 } })
  points: number;
}
