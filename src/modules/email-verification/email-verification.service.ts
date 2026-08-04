import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailVerification } from './entities/email-verification.entity';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ServerEmailService } from 'src/common/email/email.service';
import { CustomI18nService } from 'src/common/services/custom-i18n.service';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import * as crypto from 'node:crypto';
import { PasswordResetTokenService } from '../auth/password-reset-token.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: ServerEmailService,
    private readonly i18n: CustomI18nService,
    private passwordResetTokenService: PasswordResetTokenService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async sendVerificationCode(
    sendVerificationDto: SendVerificationDto,
    forgetPassword?: boolean,
  ) {
    const { email } = sendVerificationDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found.`);
    }

    if (user.isEmailVerified && !forgetPassword) {
      throw new BadRequestException(
        this.i18n.t('email-verification.EMAIL_ALREADY_VERIFIED'),
      );
    }

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentAttempts = await this.emailVerificationRepository.count({
      where: {
        userId: user.id,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (recentAttempts >= 5) {
      throw new BadRequestException(
        this.i18n.t('email-verification.VERIFICATION_LIMIT'),
      );
    }

    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    const recentRequest = await this.emailVerificationRepository.findOne({
      where: {
        userId: user.id,
        createdAt: MoreThan(oneMinuteAgo),
      },
      order: { createdAt: 'DESC' },
    });

    if (recentRequest) {
      throw new BadRequestException(
        this.i18n.t('email-verification.RECENT_REQUESTS'),
      );
    }

    const otpCode = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const emailVerification = this.emailVerificationRepository.create({
      userId: user.id,
      email: user.email, // Add email field
      otpCode,
      expiresAt,
      isForPasswordReset: forgetPassword || false, // Set the flag
    });

    await this.emailVerificationRepository.save(emailVerification);

    // Awaited on purpose. Fire-and-forget here meant a rejected send became an
    // unhandled promise: signup answered "success", nothing reached the inbox,
    // and no error was logged anywhere — the failure was invisible.
    try {
      await this.emailService.sendVerificationEmail(
        user.fullName,
        user.email,
        otpCode,
      );
      this.logger.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      // The OTP row is already stored, so the code stays usable via resend.
      // Surface the real cause instead of failing the whole signup.
      this.logger.error(
        `Failed to send verification email to ${user.email}: ${error.message}`,
        error.stack,
      );
    }

    return {
      expiresIn: '15 minutes',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otpCode } = verifyEmailDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('email-verification.USER_NOT_FOUND'),
      );
    }

    const verification = await this.emailVerificationRepository.findOne({
      where: {
        userId: user.id,
        otpCode,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!verification) {
      const latestVerification = await this.emailVerificationRepository.findOne(
        {
          where: { userId: user.id, isUsed: false },
          order: { createdAt: 'DESC' },
        },
      );

      if (latestVerification) {
        latestVerification.attempts += 1;
        await this.emailVerificationRepository.save(latestVerification);

        if (latestVerification.attempts >= 5) {
          latestVerification.isUsed = true;
          await this.emailVerificationRepository.save(latestVerification);
          throw new BadRequestException(
            this.i18n.t('email-verification.ATTEMPTS_LIMIT_EXCEEDED'),
          );
        }
      }

      throw new BadRequestException(
        this.i18n.t('email-verification.INVALID_VERIFICATION_CODE'),
      );
    }

    // Mark verification as used
    verification.isUsed = true;
    await this.emailVerificationRepository.save(verification);

    // Check if this was for password reset BEFORE updating user
    const isPasswordReset = verification.isForPasswordReset;

    if (!isPasswordReset) {
      // Only update email verification status for regular signup
      user.isEmailVerified = true;
      await this.userRepository.save(user);

      // Beta stop-gap while Paymob is not live: a verified user would otherwise
      // have no way to record anything. No-op unless FREE_SUBSCRIPTION_ON_VERIFY
      // is on, and it swallows its own errors so verification never fails here.
      await this.subscriptionsService.grantFreeSubscriptionOnVerify(user.id);
    }

    if (isPasswordReset) {
      // Generate password reset token
      const passwordResetToken =
        this.passwordResetTokenService.generatePasswordResetToken(email);

      return {
        passwordResetToken, // Return the token
      };
    }

    return {
      passwordResetToken: null,
    };
  }

  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async cleanupExpiredCodes() {
    // `LessThan`, not `MoreThan`: delete codes whose expiry is in the past.
    // The previous comparison deleted every *still valid* code and kept the
    // expired ones forever.
    const result = await this.emailVerificationRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected;
  }
}
