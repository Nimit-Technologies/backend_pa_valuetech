import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { CREDENTIALS } from "../../../constant/credentials.js";

const PEPPER = CREDENTIALS.PEPPER_SECRET ?? "";
const SALT_ROUNDS = CREDENTIALS.SALT_ROUNDS;

export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  `password-timing-equalizer:${PEPPER}`,
  10,
);

export const hashPassword = (plainPassword) =>
  bcrypt.hash(plainPassword + PEPPER, SALT_ROUNDS);

export const verifyPassword = (plainPassword, storedHash) =>
  bcrypt.compare(plainPassword + PEPPER, storedHash || DUMMY_PASSWORD_HASH);

export const passwordsMatch = (password, confirmPassword) =>
  typeof password === "string" &&
  typeof confirmPassword === "string" &&
  password === confirmPassword;

export const RESET_TOKEN_BYTES = 32;
export const RESET_TOKEN_TTL_MINUTES = 30;

export const hashResetToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

export const generateResetToken = () => {
  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
  };
};

export const verifyResetToken = (token, storedHash) => {
  if (typeof storedHash !== "string" || storedHash.length === 0) return false;
  const presented = Buffer.from(hashResetToken(token), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return (
    presented.length === stored.length &&
    crypto.timingSafeEqual(presented, stored)
  );
};

export const isResetTokenExpired = (expiresAt) => {
  const ts = new Date(expiresAt).getTime();
  return Number.isNaN(ts) || ts <= Date.now();
};
