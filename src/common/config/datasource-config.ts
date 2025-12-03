import { DataSource, DataSourceOptions } from 'typeorm';
import * as process from 'node:process';
import { config } from 'dotenv';
import * as path from 'node:path';

import { config as dotenvConfig } from 'dotenv';
import { Logger } from '@nestjs/common';
dotenvConfig({
  path: `.env`,
});
const projectRoot = process.cwd();
const appEnv = process.env.APP_ENV;
const envPath = path.join(projectRoot, `.env`);

config({
  path: envPath,
});

export const dataSourceOptions:DataSourceOptions = {
  type: 'postgres',
  synchronize: false, // Changed back to false after initial database setup
  logging: false,
  migrations: ['dist/migrations/*{.ts,.js}'],
};
if (appEnv === 'development' ||appEnv === 'production') {
  Object.assign(dataSourceOptions, {
    host: process.env.DATABASE_HOST ,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME ,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME ,
    entities: ['dist/**/*.entity.js']
  });
} else {
  console.error('Invalid NODE_ENV environment variable. Expected "development", "production", or "test".');
  process.exit(1);
}


const datasourceConfig = new DataSource(dataSourceOptions);

export default datasourceConfig;
