import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email or phone number',
    example: 'student@example.com',
    examples: {
      email: {
        summary: 'Using email',
        value: 'student@example.com',
      },
      phone: {
        summary: 'Using phone number',
        value: '+201234567890',
      },
    },
  })
  @IsNotEmpty({ message: 'Email or phone number is required' })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'Password',
    example: 'Password@123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Player ID for notifications (OneSignal)',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  playerId?: string;
}
