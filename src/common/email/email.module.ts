import { Module, Logger } from '@nestjs/common';
import { ServerEmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env['APP_ENV']}`,
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const port = parseInt(configService.getOrThrow<string>('SMTP_PORT'));
        // Port 465 speaks TLS from the first byte (implicit TLS); 587 starts
        // plaintext and upgrades via STARTTLS. Hard-coding secure:false broke
        // 465 outright, and some hosts block outbound 587 — so this has to
        // follow the port rather than assume one.
        const secure =
          (configService.get<string>('SMTP_SECURE') ?? '').toLowerCase() ===
            'true' || port === 465;

        const transport = {
          host: configService.getOrThrow<string>('SMTP_HOST'),
          port,
          secure,
          auth: {
            user: configService.getOrThrow<string>('SMTP_USER'),
            pass: configService.getOrThrow<string>('SMTP_PASS'),
          },
          // Only meaningful for STARTTLS; on an implicit-TLS port it is
          // redundant and nodemailer ignores it.
          requireTLS: !secure,
          connectionTimeout: 15000,
          greetingTimeout: 15000,
        };
        return {
          transport,
          defaults: {
            from: configService.getOrThrow<string>('SMTP_FROM'),
          },
          template: {
            dir: __dirname + '/templates',
            options: { strict: true },
          },
        };
      },
    }),
  ],
  controllers: [],
  providers: [ServerEmailService],
  exports: [ServerEmailService],
})
export class ServerEmailModule {}
