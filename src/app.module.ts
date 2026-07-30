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
import aiConfig from './common/config/ai.config';
import OvhStorageConfig from './common/config/cloud-storage.config';
import paymobConfig from './common/config/paymob.config';
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

const isProduction = process.env.APP_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [JWTConfig, appConfig, aiConfig, OvhStorageConfig, paymobConfig],
      envFilePath: ['.env'],
      cache: true,
    }),
    I18nModule.forRoot({
      loaderOptions: {
        // In development read the translations straight from source. `nest
        // build`/`--watch` sets deleteOutDir, so every rebuild wipes dist/i18n
        // out from under a running process — with watch enabled that surfaces
        // as an unhandled ENOENT that kills the app. src/i18n is never
        // deleted, so the dev process is immune to a concurrent rebuild.
        // In production dist/i18n is the only copy that ships (see the assets
        // block in nest-cli.json) and nothing rewrites it at runtime.
        path: isProduction
          ? path.join(process.cwd(), 'dist/i18n/')
          : path.join(process.cwd(), 'src/i18n/'),
        // Only worth watching where the files actually change by hand.
        watch: !isProduction,
      },
      fallbackLanguage: 'ar',
      resolvers: [AcceptLanguageResolver],
    }),
    // autoLoadEntities registers every entity pulled in through forFeature(),
    // so the entity *classes* the app actually uses are the ones TypeORM maps.
    // The static `dist/**/*.entity.js` glob is dropped here because under ts-jest
    // (e2e) the app runs from src while that glob loads a *different* compiled
    // class, giving "No metadata for <Entity>". Migrations use the separate CLI
    // datasource in datasource-config.ts, which keeps its own entities glob.
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      entities: undefined,
      autoLoadEntities: true,
    }),
    CustomI18nModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
        },
      ],
    }),
    AuthModule,
    UserModule,
    QuranModule,
    QuranAudioModule,
    PlansModule,
    SubscriptionsModule,
    RecitationsModule,
    AppVersionModule,
    NotificationModule,
    AppSettingsModule,
    FaqModule,
    EmailVerificationModule,
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
