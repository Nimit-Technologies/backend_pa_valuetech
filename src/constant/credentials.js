const parsedBodyLimitMb = parseInt(process.env.BODY_LIMIT, 10);

const BODY_LIMIT_MB =
  Number.isFinite(parsedBodyLimitMb) && parsedBodyLimitMb > 0
    ? Math.min(parsedBodyLimitMb, 50)
    : 10;

const parsedSimilarityThreshold = Number.parseFloat(
  process.env.ADDRESS_SIMILARITY_THRESHOLD,
);

// pg_trgm's cutoff for "this address resembles that one", applied with
// set_limit() before the similar-case query runs.
//
// Far above pg_trgm's own 0.3 default, because the whole address is matched as
// one string and the locality tail is most of it. Measured against this
// database's addresses, scoring everything against one sample address:
//
//   0.96  the same property, filed again
//   0.95  the plot next door (trigrams cannot see a house number)
//   0.89  same lane, different sector
//   0.73  the same address, sloppily retyped and abbreviated
//   0.59  the shared city/district/state/PIN/country tail, on its own
//   0.46  an unrelated property in the same city
//
// That 0.59 is the floor: any cutoff at or below it matches every case in the
// locality, which is why 0.3 returned 13 of 17 addresses. The usable window is
// roughly 0.60 to 0.72 — above the locality noise, below a genuine retype —
// and 0.65 sits in the middle of it. Re-measure when the address data grows;
// a short lane field pushes the noise floor up.
const ADDRESS_SIMILARITY_THRESHOLD =
  Number.isFinite(parsedSimilarityThreshold) &&
  parsedSimilarityThreshold > 0 &&
  parsedSimilarityThreshold <= 1
    ? parsedSimilarityThreshold
    : 0.65;

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
  ADDRESS_SIMILARITY_THRESHOLD,

  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY,
  PEPPER_SECRET: process.env.PEPPER_SECRET,
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS, 10) || 12,

  // PII-at-rest encryption (see src/utils/encryption.js). Both are 32-byte
  // keys as 64 hex chars; keep them distinct from each other and from
  // JWT_SECRET / PEPPER_SECRET.
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  BLIND_INDEX_KEY: process.env.BLIND_INDEX_KEY,
};
