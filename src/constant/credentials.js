const parsedBodyLimitMb = parseInt(process.env.BODY_LIMIT, 10);

const BODY_LIMIT_MB =
  Number.isFinite(parsedBodyLimitMb) && parsedBodyLimitMb > 0
    ? Math.min(parsedBodyLimitMb, 50)
    : 10;

export const CREDENTIALS = {
  // APPLICATION CONFIGURATION
  APP_ENV: process.env.NODE_ENV,
  APP_NAME: process.env.APP_NAME,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  APP_PROTOCOL: process.env.APP_PROTOCOL,
  APPLICATION_BASE_URL: process.env.APP_BASE_URL,
  BODY_LIMIT: BODY_LIMIT_MB,

  IP_ADDRESS: process.env.IP_ADDRESS,
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
  DATA_LIMIT: process.env.DATA_LIMIT,

  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY,
  PEPPER_SECRET: process.env.PEPPER_SECRET,
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS, 10) || 12,
};
