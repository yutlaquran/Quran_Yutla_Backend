import { Injectable, Logger } from '@nestjs/common';
import { passwordResetEmail, verificationEmail } from './email.constants';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

type MailProvider = 'smtp' | 'resend';

/**
 * Two delivery paths, because SMTP is not always reachable: several hosting
 * providers (Railway among them) block outbound 25/465/587 to stop spam, which
 * surfaces as ETIMEDOUT no matter how correct the credentials are. Resend goes
 * over plain HTTPS on 443, so it works where SMTP cannot.
 *
 * SMTP is kept as the default so local development and self-hosting are
 * unaffected.
 */
@Injectable()
export class ServerEmailService {
  private readonly logger = new Logger(ServerEmailService.name);
  private readonly provider: MailProvider;
  private readonly fromEmail: string;
  private readonly resendApiKey: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY') || '';

    const configured = (
      this.configService.get<string>('MAIL_PROVIDER') || ''
    ).toLowerCase();

    // An API key on its own is enough to switch: setting it and still sending
    // over a blocked SMTP port is never what was intended.
    this.provider =
      configured === 'resend' || (!configured && this.resendApiKey)
        ? 'resend'
        : 'smtp';

    this.fromEmail =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('SMTP_FROM') ||
      'Quran Yutla <onboarding@resend.dev>';

    if (this.provider === 'resend' && !this.resendApiKey) {
      this.logger.error(
        'MAIL_PROVIDER=resend but RESEND_API_KEY is empty — every send will fail',
      );
    }

    this.logger.log(`Mail provider: ${this.provider}, from: ${this.fromEmail}`);
  }

  private async sendViaResend(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.fromEmail, to: [to], subject, html }),
    });

    if (!response.ok) {
      // Resend answers with a JSON body explaining the refusal (unverified
      // domain, invalid key, rate limit). Surface it — the bare status code
      // does not distinguish those.
      const detail = await response.text().catch(() => '');
      throw new Error(`Resend returned ${response.status}: ${detail}`);
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (this.provider === 'resend') {
      await this.sendViaResend(to, subject, html);
      return;
    }

    await this.mailerService.sendMail({
      to,
      from: this.fromEmail,
      subject,
      text: 'Welcome to Quran Yutla',
      html,
    });
  }

  async sendVerificationEmail(
    username: string,
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    const trimmedEmail = email.trim();
    try {
      await this.send(
        trimmedEmail,
        'Email Verification',
        verificationEmail(username, otp),
      );
      return {
        success: true,
        message: `Verification email sent successfully to ${trimmedEmail}`,
      };
    } catch (error) {
      // Keep the original error as the cause: transport failures carry the code
      // that actually identifies the problem (EAUTH = bad credentials,
      // ETIMEDOUT = blocked port), and a plain re-wrap throws it away.
      throw new Error(
        `Failed to send verification email to ${trimmedEmail} via ${this.provider}: ${error.code ?? ''} ${error.message}`,
        { cause: error },
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    verificationCode: string,
  ): Promise<{ success: boolean; message: string }> {
    const trimmedEmail = email.trim();
    try {
      await this.send(
        trimmedEmail,
        'Reset Password',
        passwordResetEmail(verificationCode),
      );
      return {
        success: true,
        message: `Password reset email sent successfully to ${trimmedEmail}`,
      };
    } catch (error) {
      throw new Error(
        `Failed to send password reset email to ${trimmedEmail} via ${this.provider}: ${error.code ?? ''} ${error.message}`,
        { cause: error },
      );
    }
  }
}
