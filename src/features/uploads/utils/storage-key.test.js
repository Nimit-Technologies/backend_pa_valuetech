import test from "node:test";
import assert from "node:assert/strict";

import {
  ALLOWED_MIME_TYPES,
  InvalidStorageKeyInputError,
  buildCaseFolderPrefix,
  candidateStorageKeys,
  extensionForMimeType,
  randomSuffix,
  sanitizeEmployeeId,
} from "./storage-key.js";

const NOIDA_ID = "cmuy2dooo000078p01eu5kfgn";
const CASE_ID = "cmv7nmjdg0001i0p0tf8g56x6";

test("buildCaseFolderPrefix joins branch and case id, nothing else", () => {
  assert.equal(
    buildCaseFolderPrefix({ branchId: NOIDA_ID, caseId: CASE_ID }),
    `${NOIDA_ID}/${CASE_ID}`,
  );
});

test("buildCaseFolderPrefix rejects a branch or case id containing /, .. or spaces", () => {
  for (const bad of ["a/b", "a..b", "a b", "", undefined, null]) {
    assert.throws(
      () => buildCaseFolderPrefix({ branchId: bad, caseId: CASE_ID }),
      InvalidStorageKeyInputError,
      `branchId=${JSON.stringify(bad)}`,
    );
    assert.throws(
      () => buildCaseFolderPrefix({ branchId: NOIDA_ID, caseId: bad }),
      InvalidStorageKeyInputError,
      `caseId=${JSON.stringify(bad)}`,
    );
  }
});

test("sanitizeEmployeeId accepts letters, digits and hyphens", () => {
  assert.equal(sanitizeEmployeeId("emp05"), "emp05");
  assert.equal(sanitizeEmployeeId("EMP-05"), "EMP-05");
});

test("sanitizeEmployeeId rejects anything else", () => {
  for (const bad of ["emp 05", "emp/05", "emp.05", "", "emp$05"]) {
    assert.throws(
      () => sanitizeEmployeeId(bad),
      InvalidStorageKeyInputError,
      bad,
    );
  }
});

test("extensionForMimeType derives the extension from the MIME type, not a file name", () => {
  assert.equal(extensionForMimeType("image/jpeg"), "jpg");
  assert.equal(extensionForMimeType("image/png"), "png");
  assert.equal(extensionForMimeType("image/webp"), "webp");
  assert.equal(extensionForMimeType("application/pdf"), "pdf");
});

test("extensionForMimeType rejects anything not on the allow-list", () => {
  // photo.exe sent with a spoofed image/jpeg type is still just image/jpeg
  // here — the point is that application/x-msdownload itself is refused.
  assert.throws(
    () => extensionForMimeType("application/x-msdownload"),
    InvalidStorageKeyInputError,
  );
  assert.ok(!ALLOWED_MIME_TYPES.includes("application/x-msdownload"));
});

test("candidateStorageKeys yields the plain name first", () => {
  const [first] = candidateStorageKeys({
    branchId: NOIDA_ID,
    caseId: CASE_ID,
    employeeId: "emp05",
    mimeType: "image/jpeg",
  });

  assert.equal(first, `${NOIDA_ID}/${CASE_ID}/emp05_${CASE_ID}.jpg`);
});

test("candidateStorageKeys falls back to a random, distinct suffix on each retry", () => {
  const stubSuffixes = ["a7k2", "q9zz", "a7k2"]; // deliberately repeats once
  let i = 0;
  const generator = candidateStorageKeys(
    {
      branchId: NOIDA_ID,
      caseId: CASE_ID,
      employeeId: "emp05",
      mimeType: "image/jpeg",
    },
    { maxAttempts: 3, suffixGenerator: () => stubSuffixes[i++] },
  );

  const keys = [...generator];

  assert.deepEqual(keys, [
    `${NOIDA_ID}/${CASE_ID}/emp05_${CASE_ID}.jpg`,
    `${NOIDA_ID}/${CASE_ID}/emp05_${CASE_ID}_a7k2.jpg`,
    `${NOIDA_ID}/${CASE_ID}/emp05_${CASE_ID}_q9zz.jpg`,
    `${NOIDA_ID}/${CASE_ID}/emp05_${CASE_ID}_a7k2.jpg`,
  ]);
});

test("the default random suffix is a 4-character lowercase/digit string that varies", () => {
  const seen = new Set();
  for (let i = 0; i < 20; i++) {
    const suffix = randomSuffix();
    assert.match(suffix, /^[a-z0-9]{4}$/);
    seen.add(suffix);
  }
  // Collisions are possible but 20 draws from a 36^4 space all matching is not.
  assert.ok(seen.size > 1);
});

test("candidateStorageKeys rejects an unsafe employee id before yielding anything", () => {
  const generator = candidateStorageKeys({
    branchId: NOIDA_ID,
    caseId: CASE_ID,
    employeeId: "emp 05",
    mimeType: "image/jpeg",
  });

  assert.throws(() => generator.next(), InvalidStorageKeyInputError);
});
