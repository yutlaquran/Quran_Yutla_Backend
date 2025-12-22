import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CountryEnum } from '../../../../common/enums/country.enum';
import { Gender } from '../../../user/enums/gender.enum';
import { AgeGroup } from '../../../user/enums/age-group.enum';

export class StudentSignUpDto {
  @ApiProperty({
    description: 'Student email address',
    example: 'student@example.com',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email cannot be longer than 255 characters' })
  email: string;

  @ApiProperty({
    description: 'Student full name',
    example: 'Ahmed Mohamed Ali',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  @MaxLength(100, { message: 'Full name cannot be longer than 100 characters' })
  fullName: string;

  @ApiProperty({
    description: 'Phone number (10-15 digits)',
    example: '+201234567890',
    minLength: 10,
    maxLength: 15,
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @MinLength(10, { message: 'Phone number must be at least 10 digits' })
  @MaxLength(15, { message: 'Phone number cannot exceed 15 digits' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Country',
    enum: CountryEnum,
    example: CountryEnum.EGYPT,
  })
  @IsNotEmpty({ message: 'Country is required' })
  @IsEnum(CountryEnum, { message: 'Please select a valid country' })
  country: CountryEnum;

  @ApiProperty({
    description: 'Age group',
    enum: AgeGroup,
    example: AgeGroup.YOUTH,
  })
  @IsNotEmpty({ message: 'Age group is required' })
  @IsEnum(AgeGroup, { message: 'Please select a valid age group' })
  ageGroup: AgeGroup;

  @ApiPropertyOptional({
    description: 'Gender (Male/Female)',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Please select a valid gender' })
  gender?: Gender;

  @ApiProperty({
    description:
      'Password (min 8 characters with uppercase, lowercase, number and special character)',
    example: 'Password@123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must be at least 8 characters with uppercase, lowercase, number and special character',
    },
  )
  password: string;

  @ApiPropertyOptional({
    description: 'Player ID for notifications (OneSignal)',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  playerId?: string;
}
