import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500, {
    message: 'Refresh token cannot be longer than 500 characters.',
  })
  refreshToken: string;
}
