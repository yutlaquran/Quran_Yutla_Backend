import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerification } from './entities/email-verification.entity';
import { User } from '../user/entities/user.entity';
import { PasswordResetTokenService } from '../auth/password-reset-token.service';
import { ServerEmailModule } from 'src/common/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerification, User]),
    JwtModule.register({}),
    ConfigModule,
    ServerEmailModule,
  ],
  providers: [EmailVerificationService, PasswordResetTokenService],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
