import crypto from "node:crypto";
import { CREDENTIALS } from "../constant/credentials.js";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const SCHEME_VERSION = "v1";

const toKey = (hex, name) => {
  if (typeof hex !== "string" || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      `${name} must be set to 64 hex characters (32 bytes). Generate one with: openssl rand -hex 32`,
    );
  }
  return Buffer.from(hex, "hex");
};

const ENCRYPTION_KEY = toKey(CREDENTIALS.ENCRYPTION_KEY, "ENCRYPTION_KEY");
const BLIND_INDEX_KEY = toKey(CREDENTIALS.BLIND_INDEX_KEY, "BLIND_INDEX_KEY");

export const encrypt = (plaintext) => {
  if (plaintext === null || plaintext === undefined) return null;
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    SCHEME_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
};

export const decrypt = (payload) => {
  if (payload === null || payload === undefined) return null;
  const parts = String(payload).split(":");
  if (parts.length !== 4 || parts[0] !== SCHEME_VERSION) {
    throw new Error("encryption.decrypt: unrecognized ciphertext format");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
};

export const blindIndex = (value) => {
  if (value === null || value === undefined) return null;
  return crypto
    .createHmac("sha256", BLIND_INDEX_KEY)
    .update(String(value))
    .digest("hex");
};

export const safeDecrypt = (payload) => {
  try {
    return decrypt(payload);
  } catch {
    return null;
  }
};

/**
 * Decrypts a value read back from storage that may or may not be one of our
 * ciphertexts: a "v1:" payload is decrypted (null if it can't be), anything
 * else is passed straight through — covers rows written before encryption
 * was added, or by a seed/migration script. Use this, not raw `decrypt`,
 * whenever the input is a stored column value.
 */
export const decryptStored = (value) => {
  if (value === null || value === undefined) return null;
  const str = String(value);
  return str.startsWith(`${SCHEME_VERSION}:`) ? safeDecrypt(str) : str;
};

export const maskTail = (value, visible = 4) => {
  if (value === null || value === undefined) return null;
  const str = String(value);
  if (str.length <= visible) return str;
  return "X".repeat(str.length - visible) + str.slice(-visible);
};
