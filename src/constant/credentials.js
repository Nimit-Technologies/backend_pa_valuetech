export const CREDENTIALS = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS, 10) || 10,
};