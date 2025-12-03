import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthModule } from '../../modules/auth/auth.module';
import { UserModule } from '../../modules/user/user.module';
import { QuranModule } from '../../modules/quran/quran.module';
import { QuranAudioModule } from '../../modules/quran-audio/quran-audio.module';
import { EmailVerificationModule } from '../../modules/email-verification/email-verification.module';
import { FaqModule } from '../../modules/faq/faq.module';
import { NotificationModule } from '../../modules/notification/notification.module';
import { AppSettingsModule } from '../../modules/app-settings/app-settings.module';
import { AppVersionModule } from '../../modules/app-version/app-version.module';
import { PlansModule } from '../../modules/plans/plans.module';
import { SubscriptionsModule } from '../../modules/subscriptions/subscriptions.module';
import { RecitationsModule } from '../../modules/recitations/recitations.module';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Quran Yutla API')
    .setDescription('AI-Powered Quran Learning Platform - Complete API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [
      AuthModule,
      UserModule,
      PlansModule,
      SubscriptionsModule,
      RecitationsModule,
      QuranModule,
      QuranAudioModule,
      EmailVerificationModule,
      FaqModule,
      NotificationModule,
      AppSettingsModule,
      AppVersionModule,
    ],
  });

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Quran Yutla API',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai'
      }
    }
  });
}
