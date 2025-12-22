import { registerAs } from '@nestjs/config';

export default registerAs(
  'paymob',
  (): Record<string, unknown> => ({
    apiKey: process.env.PAYMOB_API_KEY,
    integrationIdCard: process.env.PAYMOB_INTEGRATION_ID_CARD,
    integrationIdWallet: process.env.PAYMOB_INTEGRATION_ID_WALLET,
    hmacSecret: process.env.PAYMOB_HMAC_SECRET,
    currency: process.env.PAYMOB_CURRENCY || 'EGP',
    successUrl: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3777/payment/success',
    failureUrl: process.env.PAYMENT_FAILURE_URL || 'http://localhost:3777/payment/failed',
    iframeId: process.env.PAYMOB_IFRAME_ID,
    baseUrl: 'https://accept.paymob.com/api',
  }),
);
