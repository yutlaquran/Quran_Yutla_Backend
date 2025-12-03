import { registerAs } from '@nestjs/config';

export default registerAs(
  'OvhStorage',
  (): Record<string, unknown> => ({
    endpoint: process.env.OVH_ENDPOINT,
    region: process.env.OVH_REGION,
    accessKey: process.env.OVH_ACCESS_KEY,
    secretKey: process.env.OVH_SECRET_ACCESS_KEY,
    bucketName: process.env.OVH_BUCKET_NAME,
    baseUrl: process.env.OVH_BASE_URL,
    fileSizeLimit:
      parseInt(process.env.MAX_SIZE_FILE_UPLOAD || '20', 10) * 1024 * 1024,
    fileCsvSizeLimit:
      parseInt(process.env.MAX_SIZE_CSV_UPLOAD || '50', 10) * 1024 * 1024,
    maxRows: parseInt(process.env.MAX_CSV_ROWS || '10000', 10),
  }),
);
