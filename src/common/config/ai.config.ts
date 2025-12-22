import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5000',
  apiKey: process.env.AI_API_KEY || '',
  webhookSecret: process.env.AI_WEBHOOK_SECRET || '',
  timeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '30000', 10), // 30 seconds default
}));
