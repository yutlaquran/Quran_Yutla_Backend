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
        const transport = {
          host: configService.getOrThrow<string>('SMTP_HOST'),
          port: parseInt(configService.getOrThrow<string>('SMTP_PORT')),
          secure: false,
          auth: {
            user: configService.getOrThrow<string>('SMTP_USER'),
            pass: configService.getOrThrow<string>('SMTP_PASS'),
          },
          requireTLS: true
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
