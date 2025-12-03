import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface PasswordResetPayload {
  email: string;
  type: 'password-reset';
  iat?: number;
  exp?: number;
}

@Injectable()
export class PasswordResetTokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generatePasswordResetToken(email: string): string {
    const payload: PasswordResetPayload = {
      email,
      type: 'password-reset',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '10m', // Token expires in 10 minutes
    });
  }

  async verifyPasswordResetToken(token: string): Promise<PasswordResetPayload> {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }
}
