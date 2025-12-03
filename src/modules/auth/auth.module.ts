import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from '../../common/entities/token.entity';
import { PasswordService } from '../../common/helpers/encryption/password.service';
import { EmailVerificationModule } from '../email-verification/email-verification.module';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordResetTokenService } from './password-reset-token.service';
import { PasswordResetGuard } from '../../common/guards/password-reset.guard';

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT.secret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT.expiresIn', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    TypeOrmModule.forFeature([User, Token]),
    EmailVerificationModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordResetTokenService,
    PasswordResetGuard,
    JwtStrategy,
    PasswordService,
  ],
  exports: [AuthService, PasswordResetTokenService],
})
export class AuthModule {}
