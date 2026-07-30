import { registerAs } from '@nestjs/config';

export default registerAs(
  'app',
  (): Record<string, unknown> => ({
    name: process.env.APP_NAME ?? 'QuranYutla',
    env: process.env.APP_ENV ?? 'development',
    // Publicly reachable base URL of this API. Used to build callback URLs
    // handed to external services (e.g. the AI evaluation webhook), so it must
    // be resolvable from outside this process — not localhost in production.
    url:
      process.env.APP_URL ??
      `http://localhost:${process.env.HTTP_PORT ?? '3777'}`,
    versioning: {
      enable: process.env.HTTP_VERSIONING_ENABLE === 'true',
      prefix: 'v',
      version: process.env.HTTP_VERSION ?? '1',
    },
    globalPrefix: '/api',
    http: {
      enable: process.env.HTTP_ENABLE === 'true',
      host: process.env.HTTP_HOST ?? 'localhost',
      port: process.env.HTTP_PORT
        ? Number.parseInt(process.env.HTTP_PORT)
        : 3000,
    },
  }),
);
