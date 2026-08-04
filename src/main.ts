import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/errors/error.filter';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './common/setup/swagger-setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Restrict browser origins when CORS_ORIGIN is set (comma-separated list).
  // Left unset it stays fully open, so this can't break an existing deployment
  // that relied on the previous open policy — set it in production to lock the
  // API down to the real web/app origins. Native mobile clients are unaffected
  // either way (they don't send a browser Origin).
  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  app.enableCors(
    corsOrigin
      ? {
          origin: corsOrigin.split(',').map((o) => o.trim()),
          credentials: true,
        }
      : undefined,
  );

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });

  setupSwagger(app);

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter(configService));

  // Bind to all interfaces, not the default loopback. Inside a container
  // nothing outside the process can reach 127.0.0.1/[::1], so a health check
  // from the platform times out even though the app started fine.
  await app.listen(process.env.HTTP_PORT ?? 3777, process.env.HTTP_HOST ?? '0.0.0.0');

  void Logger.log(`Application is running on: ${await app.getUrl()}`);
  void Logger.log(`Environment: ${process.env.APP_ENV}`);
  void Logger.log(
    `Database is running on: ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
  );
  void Logger.log(`Swagger is running on: ${await app.getUrl()}/api/docs`);
}
bootstrap()
  .then(() => {
    void Logger.log('Bootstrap completed');
  })
  .catch((error) => {
    void Logger.error('Bootstrap failed', error);
    // Exit non-zero so the orchestrator sees a failed start. Without this the
    // process just falls off the end of the event loop and exits 0, which reads
    // as a clean shutdown — a misconfigured deployment would look healthy.
    process.exit(1);
  });
