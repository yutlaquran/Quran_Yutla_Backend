import { registerAs } from '@nestjs/config';

export default registerAs('JWT', () => {
  const config = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    verificationSecret: process.env.JWT_VERIFICATION_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  };

  // Validate required configuration
  if (!config.secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  if (!config.refreshTokenSecret) {
    throw new Error(
      'JWT_REFRESH_TOKEN_SECRET is not defined in environment variables',
    );
  }

  return config;
});
