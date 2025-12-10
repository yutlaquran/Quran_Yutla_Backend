import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsNumber,
  IsPositive,
  Min,
  Max,
} from 'class-validator';

export class ParentSignUpDto {
  @ApiProperty({
    description: 'Parent email address',
    example: 'parent@example.com',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email cannot be longer than 255 characters' })
  email: string;

  @ApiProperty({
    description: 'Parent full name',
    example: 'Mohamed Ahmed Ali',
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
    description: 'Number of children',
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsNotEmpty({ message: 'Number of children is required' })
  @IsNumber({}, { message: 'Number of children must be a number' })
  @IsPositive({ message: 'Number of children must be positive' })
  @Min(1, { message: 'Number of children must be at least 1' })
  @Max(10, { message: 'Number of children cannot exceed 10' })
  numberOfChildren: number;

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
