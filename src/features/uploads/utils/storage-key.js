import { randomBytes } from "node:crypto";

// Everything here is a pure function: no Prisma, no Supabase client, no I/O.
// It only decides what a file is *called* and *where* it goes — the service
// layer is what actually talks to storage and the database.

export class InvalidStorageKeyInputError extends Error {}

// Case documents only, for now: photos and PDFs taken or scanned in the
// field. The extension is derived from this map, never from the original
// file name, so `photo.exe` uploaded as `image/jpeg` is written as `.jpg`.
const EXTENSION_BY_MIME_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const ALLOWED_MIME_TYPES = Object.freeze(
  Object.keys(EXTENSION_BY_MIME_TYPE),
);

export const extensionForMimeType = (mimeType) => {
  const ext = EXTENSION_BY_MIME_TYPE[mimeType];
  if (!ext) {
    throw new InvalidStorageKeyInputError(`Unsupported MIME type: ${mimeType}`);
  }
  return ext;
};

// branch_id and case_id are cuids chosen by this server, never by the
// request — but the folder prefix is still built from them literally, so this
// is the one place that stands between a database value and a storage path.
// A "/", a ".." or any whitespace would let a path segment escape its folder
// or merge with its neighbour.
const assertSafePathSegment = (value, label) => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("/") ||
    value.includes("..") ||
    /\s/.test(value)
  ) {
    throw new InvalidStorageKeyInputError(
      `${label} is not a valid path segment: ${JSON.stringify(value)}`,
    );
  }
};

const EMPLOYEE_ID_REGEX = /^[A-Za-z0-9-]+$/;

// The uploader's own employee_id, read from their session — not user input in
// the request-body sense, but still untrusted enough to deserve its own rule
// (letters, digits, hyphens only) rather than inheriting whatever the auth
// schema happens to allow today.
export const sanitizeEmployeeId = (employeeId) => {
  if (typeof employeeId !== "string" || !EMPLOYEE_ID_REGEX.test(employeeId)) {
    throw new InvalidStorageKeyInputError(
      "Employee ID must contain only letters, digits and hyphens",
    );
  }
  return employeeId;
};

export const buildCaseFolderPrefix = ({ branchId, caseId }) => {
  assertSafePathSegment(branchId, "branch id");
  assertSafePathSegment(caseId, "case id");
  return `${branchId}/${caseId}`;
};

const RANDOM_SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

// A short, non-sequential collision suffix (e.g. "a7k2") rather than a
// counted "_2", "_3": chosen so the server never has to list a folder before
// writing to it — see candidateStorageKeys below.
export const randomSuffix = (length = 4) => {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += RANDOM_SUFFIX_ALPHABET[bytes[i] % RANDOM_SUFFIX_ALPHABET.length];
  }
  return out;
};

// Yields the plain `<employee_id>_<case_id>.<ext>` key first, then
// random-suffixed candidates. The caller tries each in turn with a
// no-overwrite write and stops at the first one storage accepts — collisions
// are resolved by that atomic write failing, never by listing the folder and
// guessing what's free.
export function* candidateStorageKeys(
  { branchId, caseId, employeeId, mimeType },
  { maxAttempts = 5, suffixGenerator = randomSuffix } = {},
) {
  const ext = extensionForMimeType(mimeType);
  sanitizeEmployeeId(employeeId);
  const prefix = buildCaseFolderPrefix({ branchId, caseId });

  const baseName = `${employeeId}_${caseId}`;

  yield `${prefix}/${baseName}.${ext}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    yield `${prefix}/${baseName}_${suffixGenerator()}.${ext}`;
  }
}
