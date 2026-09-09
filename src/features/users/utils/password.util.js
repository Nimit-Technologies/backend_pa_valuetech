import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { CREDENTIALS } from "../../../constant/credentials.js";

/**
 * Single source of truth for how this app turns a plaintext password into a
 * stored credential and checks one back. Every call site — user creation,
 * admin user update, self-service change-password, login, and password
 * reset — MUST go through here so the pepper and the bcrypt cost factor can
 * never drift apart between "how it was hashed" and "how it's verified".
 *
 *   stored = bcrypt(plaintext + PEPPER_SECRET, SALT_ROUNDS)
 *
 * PEPPER_SECRET is a server-side secret kept OUT of the database (env only),
 * so a stolen DB dump alone can't be brute-forced offline without it —
 * defense in depth on top of bcrypt's per-hash salt (CWE-521).
 */

const PEPPER = CREDENTIALS.PEPPER_SECRET ?? "";
const SALT_ROUNDS = CREDENTIALS.SALT_ROUNDS;

// Pre-computed hash of a value no real password can equal. verifyPassword()
// runs bcrypt.compare() against this when there is no stored hash to check
// (missing user, or an account provisioned without a local password) so the
// call still takes ~the same time — response latency can't be used to
// enumerate which accounts exist (CWE-208). Cost 10 is deliberate: it only
// has to burn a comparable amount of time, not protect a real secret.
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  `password-timing-equalizer:${PEPPER}`,
  10,
);

/**
 * Hash a plaintext password for storage in `users.password`.
 * Always `await` this — bcrypt is intentionally slow.
 *
 * @param {string} plainPassword
 * @returns {Promise<string>} bcrypt hash safe to persist
 */
export const hashPassword = (plainPassword) =>
  bcrypt.hash(plainPassword + PEPPER, SALT_ROUNDS);

/**
 * Check a plaintext password against a stored bcrypt hash.
 * Pass `storedHash` straight from the DB — a null/undefined hash is handled
 * (compared against DUMMY_PASSWORD_HASH) so this never throws and stays
 * timing-safe for accounts with no local password.
 *
 * @param {string} plainPassword
 * @param {string|null|undefined} storedHash
 * @returns {Promise<boolean>}
 */
export const verifyPassword = (plainPassword, storedHash) =>
  bcrypt.compare(plainPassword + PEPPER, storedHash || DUMMY_PASSWORD_HASH);

/**
 * Equality check for a "password" / "confirm password" pair.
 * Centralized so the comparison — and any future trimming/normalizing — is
 * identical at every call site.
 *
 * @param {unknown} password
 * @param {unknown} confirmPassword
 * @returns {boolean}
 */
export const passwordsMatch = (password, confirmPassword) =>
  typeof password === "string" &&
  typeof confirmPassword === "string" &&
  password === confirmPassword;

/* -------------------------------------------------------------------------- */
/*  Password-reset token scaffolding (for the forgot-password flow)           */
/*                                                                            */
/*  Design follows the OWASP "Forgot Password" cheat sheet:                   */
/*   - The token handed to the user (in the reset link) is high-entropy       */
/*     random data.                                                           */
/*   - Only its SHA-256 hash is ever stored — a leaked reset-tokens table     */
/*     then can't be used to hijack a reset.                                  */
/*   - Tokens are single-use and short-lived (RESET_TOKEN_TTL_MINUTES).       */
/*   - Presented tokens are compared to the stored hash with timingSafeEqual. */
/*                                                                            */
/*  These helpers are pure crypto/time and touch no database. Persisting,     */
/*  expiring and single-use enforcement are the caller's job — see            */
/*  services/service.passwordResetToken.user.js.                              */
/* -------------------------------------------------------------------------- */

export const RESET_TOKEN_BYTES = 32; // 256 bits of entropy
export const RESET_TOKEN_TTL_MINUTES = 30;

/**
 * SHA-256 hex digest of a reset token — this is the value that gets stored.
 * @param {string} token
 * @returns {string} 64-char lowercase hex
 */
export const hashResetToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

/**
 * Mint a new password-reset token.
 *
 * @returns {{ token: string, tokenHash: string, expiresAt: Date }}
 *   - `token`     — send THIS to the user (reset link); never store it
 *   - `tokenHash` — store THIS (e.g. password_reset_tokens.token_hash)
 *   - `expiresAt` — store alongside; check with isResetTokenExpired()
 */
export const generateResetToken = () => {
  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
  };
};

/**
 * Timing-safe check that a presented raw token matches a stored hash.
 * Belt-and-suspenders when the row was already fetched by an exact
 * `token_hash` match, but the correct primitive to reach for if a lookup is
 * ever changed to something non-exact.
 *
 * @param {string} token       raw token from the reset request
 * @param {string} storedHash  the stored token_hash value
 * @returns {boolean}
 */
export const verifyResetToken = (token, storedHash) => {
  if (typeof storedHash !== "string" || storedHash.length === 0) return false;
  const presented = Buffer.from(hashResetToken(token), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return (
    presented.length === stored.length &&
    crypto.timingSafeEqual(presented, stored)
  );
};

/**
 * True if a stored expiry timestamp is in the past (or missing/unparseable —
 * treated as expired so a bad value fails closed).
 * @param {Date|string|number} expiresAt
 * @returns {boolean}
 */
export const isResetTokenExpired = (expiresAt) => {
  const ts = new Date(expiresAt).getTime();
  return Number.isNaN(ts) || ts <= Date.now();
};
