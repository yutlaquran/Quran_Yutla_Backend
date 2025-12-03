import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import JWTConfig from './common/config/JWT-config';
import appConfig from './common/config/app.config';
import OvhStorageConfig from './common/config/cloud-storage.config';
import { dataSourceOptions } from './common/config/datasource-config';
import { CustomI18nModule } from './common/services/custom-i18n.module';
import { LoggerMiddleware } from './logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { EmailVerificationModule } from './modules/email-verification/email-verification.module';
import { FaqModule } from './modules/faq/faq.module';
import { QuranAudioModule } from './modules/quran-audio/quran-audio.module';
import { QuranModule } from './modules/quran/quran.module';
import { UserModule } from './modules/user/user.module';
import { AppSettingsModule } from './modules/app-settings/app-settings.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AppVersionModule } from './modules/app-version/app-version.module';
import { PlansModule } from './modules/plans/plans.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { RecitationsModule } from './modules/recitations/recitations.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [JWTConfig, appConfig, OvhStorageConfig],
      envFilePath: ['.env'],
      cache: true,
    }),
    I18nModule.forRoot({
      loaderOptions: {
        path: path.join('dist/i18n/'),
        watch: true,
      },
      fallbackLanguage: 'ar',
      resolvers: [AcceptLanguageResolver],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    CustomI18nModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
        },
      ],
    }),
    UserModule,
    EmailVerificationModule,
    AuthModule,
    FaqModule,
    QuranModule,
    QuranAudioModule,
    AppSettingsModule,
    NotificationModule,
    AppVersionModule,
    PlansModule,
    SubscriptionsModule,
    RecitationsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  private nodeEnv: string;

  configure(consumer: MiddlewareConsumer) {
    this.nodeEnv = process.env.APP_ENV || 'development';
    if (this.nodeEnv === 'development') {
      consumer.apply(LoggerMiddleware).forRoutes('/');
    }
  }
}
