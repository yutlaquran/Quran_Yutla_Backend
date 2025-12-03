import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PasswordResetTokenService } from '../../modules/auth/password-reset-token.service';

@Injectable()
export class PasswordResetGuard implements CanActivate {
  constructor(private passwordResetTokenService: PasswordResetTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { passwordResetToken } = request.body;

    if (!passwordResetToken) {
      throw new UnauthorizedException('Password reset token is required');
    }

    try {
      const payload =
        await this.passwordResetTokenService.verifyPasswordResetToken(
          passwordResetToken,
        );

      if (payload.type !== 'password-reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Add the verified email to the request for use in the controller
      request.verifiedEmail = payload.email;
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }
  }
}
