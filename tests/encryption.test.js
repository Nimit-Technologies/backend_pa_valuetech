import test from "node:test";
import assert from "node:assert/strict";

// encryption.js validates both keys and derives Buffers from them at import,
// so they must exist before the module graph loads. node --test gives each
// file its own process, so this does not leak into the other suites — and
// deliberately uses throwaway keys, never the ones in .env.
process.env.ENCRYPTION_KEY = "1f".repeat(32);
process.env.BLIND_INDEX_KEY = "2e".repeat(32);

const { encrypt, decrypt, blindIndex, safeDecrypt, decryptStored, maskTail } =
  await import("../src/utils/encryption.js");

const AADHAAR = "123456789014";

// Flip a byte inside one segment of a "v1:iv:tag:data" payload.
const tamperSegment = (payload, index) => {
  const parts = payload.split(":");
  const buf = Buffer.from(parts[index], "base64url");
  buf[0] ^= 0xff;
  parts[index] = buf.toString("base64url");
  return parts.join(":");
};

test("encrypt then decrypt returns the original value", () => {
  for (const value of [
    AADHAAR,
    "",
    "a",
    "multi\nline",
    "आधार",
    "x".repeat(5000),
  ]) {
    assert.equal(decrypt(encrypt(value)), value);
  }
});

test("ciphertext carries the scheme version and four segments", () => {
  const parts = encrypt(AADHAAR).split(":");
  assert.equal(parts.length, 4);
  assert.equal(parts[0], "v1");
});

test("the same plaintext never produces the same ciphertext twice", () => {
  // A fresh IV per call. Without it, equal Aadhaar numbers would be visibly
  // equal in the database to anyone who could read the column.
  const a = encrypt(AADHAAR);
  const b = encrypt(AADHAAR);
  assert.notEqual(a, b);
  assert.equal(decrypt(a), decrypt(b));
});

test("a tampered ciphertext, IV or auth tag is rejected", () => {
  // This is the whole point of GCM over plain CBC: someone with write access
  // to the column cannot alter a stored Aadhaar number undetected.
  for (const [label, index] of [
    ["iv", 1],
    ["auth tag", 2],
    ["ciphertext", 3],
  ]) {
    assert.throws(
      () => decrypt(tamperSegment(encrypt(AADHAAR), index)),
      `tampering with the ${label} should throw`,
    );
  }
});

test("decrypt refuses a payload that is not ours", () => {
  for (const value of ["", "plain text", "v2:a:b:c", "v1:only:three"]) {
    assert.throws(
      () => decrypt(value),
      /unrecognized ciphertext format/,
      `expected a throw for ${JSON.stringify(value)}`,
    );
  }
});

test("safeDecrypt swallows what decrypt throws on", () => {
  assert.equal(safeDecrypt("not a ciphertext"), null);
  assert.equal(safeDecrypt(tamperSegment(encrypt(AADHAAR), 3)), null);
  assert.equal(safeDecrypt(encrypt(AADHAAR)), AADHAAR);
});

test("blindIndex is deterministic", () => {
  // Lookups match on this value. If it ever stopped being stable for the same
  // input, every existing row would silently become unfindable.
  assert.equal(blindIndex(AADHAAR), blindIndex(AADHAAR));
  assert.equal(blindIndex(AADHAAR), blindIndex(String(AADHAAR)));
});

test("blindIndex separates different inputs and hides the original", () => {
  assert.notEqual(blindIndex(AADHAAR), blindIndex("123456789015"));
  assert.match(blindIndex(AADHAAR), /^[0-9a-f]{64}$/);
  assert.ok(!blindIndex(AADHAAR).includes(AADHAAR));
});

test("null and undefined pass through every helper as null", () => {
  for (const fn of [
    encrypt,
    decrypt,
    blindIndex,
    safeDecrypt,
    decryptStored,
    maskTail,
  ]) {
    assert.equal(fn(null), null, `${fn.name}(null)`);
    assert.equal(fn(undefined), null, `${fn.name}(undefined)`);
  }
});

test("decryptStored passes through anything not written by us", () => {
  // Rows written before encryption was added, or by a seed script.
  assert.equal(decryptStored("123456789014"), "123456789014");
  assert.equal(decryptStored(encrypt(AADHAAR)), AADHAAR);
  // A "v1:" payload that cannot be decrypted is null, not the raw string —
  // returning the ciphertext would put it on screen as if it were a value.
  assert.equal(decryptStored(tamperSegment(encrypt(AADHAAR), 3)), null);
});

test("maskTail leaves only the trailing digits", () => {
  assert.equal(maskTail(AADHAAR), "XXXXXXXX9014");
  assert.equal(maskTail(AADHAAR, 2), "XXXXXXXXXX14");
  // Nothing to hide, and nothing padded to imply there is.
  assert.equal(maskTail("9014"), "9014");
  assert.equal(maskTail("14"), "14");
});
