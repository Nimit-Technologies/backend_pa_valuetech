import { CREDENTIALS } from "./credentials.js";

const DEFAULT_JWT_EXPIRY = "24h";

const UNIT_TO_MS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

// JWT_EXPIRY is written as "<number><unit>" — "24h", "30m", "7d". A bare
// number is read as seconds, which is where this parser deliberately differs
// from jsonwebtoken: handed the string "3600" it would sign a token that lives
// 3.6 seconds, because its string form defaults to milliseconds. Nobody who
// writes JWT_EXPIRY=3600 means that.
const DURATION_PATTERN = /^(\d+)\s*(ms|s|m|h|d)?$/i;

export function parseDurationToMs(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = DURATION_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount * UNIT_TO_MS[(match[2] ?? "s").toLowerCase()];
}

function resolveTokenTtlMs() {
  const configured = CREDENTIALS.JWT_EXPIRY;

  if (configured === undefined || configured === "") {
    return parseDurationToMs(DEFAULT_JWT_EXPIRY);
  }

  const parsed = parseDurationToMs(configured);

  if (parsed === null) {
    console.warn(
      `[cookie-option] JWT_EXPIRY="${configured}" is not a valid duration — falling back to ${DEFAULT_JWT_EXPIRY}.`,
    );
    return parseDurationToMs(DEFAULT_JWT_EXPIRY);
  }

  return parsed;
}

// Seconds, because jsonwebtoken reads a numeric expiresIn as seconds. The
// cookie's maxAge below is derived from the same number, so the browser stops
// sending the cookie at the moment the token stops verifying — the two cannot
// drift apart.
export const TOKEN_TTL_SECONDS = Math.floor(resolveTokenTtlMs() / 1000);

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: TOKEN_TTL_SECONDS * 1000,
  path: "/",
};
