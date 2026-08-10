export const CREDENTIALS = {
  PORT: process.env.PORT,
  BACKEND_BASE_URL: process.env.APP_BASE_URL,

  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS, 10) || 10,
  BODY_LIMIT: parseInt(process.env.BODY_LIMIT, 10) || 10,

  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
};
