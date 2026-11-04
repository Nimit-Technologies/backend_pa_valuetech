import { getCaseFilesBucket } from "../../config/supabase-storage.client.js";
import { candidateStorageKeys } from "./utils/storage-key.js";

const MAX_STORAGE_KEY_ATTEMPTS = 5;

// Not a static top-level `import prisma from "../../prisma/client.js"`: that
// module connects to the database as a side effect of being imported, which
// would mean importing this file — the thing a plain unit test with an
// injected fake prismaClient does — silently depended on a live database
// connection anyway. The real client is only ever touched when a caller
// genuinely omits prismaClient, i.e. in production; by then server.js has
// already imported it once, so this resolves from Node's module cache
// instead of connecting a second time.
let realPrismaClient;
const getRealPrismaClient = async () => {
  if (!realPrismaClient) {
    realPrismaClient = (await import("../../prisma/client.js")).default;
  }
  return realPrismaClient;
};

// Mirrors resolveBranchScope's own contract (src/utils/branch-scope.js): null
// means every branch, any other string must equal the case's branch_id, and
// the sentinel it returns for a branchless session will simply never equal a
// real branch_id.
const caseIsInScope = (record, scopedBranchId) =>
  scopedBranchId === null || record.branch_id === scopedBranchId;

// Loads only what the upload flow needs — never the full case record — and
// applies the same branch check resolveBranchScope's other callers use, so a
// case outside the caller's branch is reported as 404 rather than fetched and
// then rejected with a 403 that would confirm it exists.
export const loadCaseForUpload = async (
  caseId,
  scopedBranchId,
  prismaClient,
) => {
  const client = prismaClient ?? (await getRealPrismaClient());
  const caseRecord = await client.case.findUnique({
    where: { id: caseId },
    select: { id: true, branch_id: true, deleted_at: true },
  });

  if (!caseRecord || !caseIsInScope(caseRecord, scopedBranchId)) {
    return null;
  }

  return caseRecord;
};

const isConflictError = (error) =>
  Boolean(error) &&
  (error.statusCode === "409" ||
    error.statusCode === 409 ||
    /already exists|duplicate/i.test(error.message || ""));

// Writes the file under the first storage key that turns out to be free,
// discovered by attempting a no-overwrite write rather than listing the
// folder first — the write itself is the only thing that can answer "is this
// name taken?" without a race. Every candidate after the first carries a
// random suffix (utils/storage-key.js), so running out of attempts means
// something else is wrong, not an ordinary collision.
const writeCaseFileObject = async ({
  branchId,
  caseId,
  employeeId,
  mimeType,
  buffer,
  bucket,
}) => {
  let lastError;

  for (const storagePath of candidateStorageKeys(
    { branchId, caseId, employeeId, mimeType },
    { maxAttempts: MAX_STORAGE_KEY_ATTEMPTS },
  )) {
    const { error } = await bucket.upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (!error) return storagePath;
    if (!isConflictError(error)) throw error;
    lastError = error;
  }

  throw lastError ?? new Error("No free storage key found after every attempt");
};

// The one write path for a case document: validated upload -> no-overwrite
// storage write -> case_files row, as a single unit. If the row can't be
// written, the object is removed again rather than left orphaned. Note:
// storage_path is never edited after this, even if the case later changes
// branch — moving an already-written file is a separate, explicit operation
// this task does not cover.
export const createCaseFile = async ({
  caseRecord,
  actor,
  file,
  // Injectable so tests can pass a fake bucket (upload/remove/createSignedUrl)
  // instead of talking to Supabase; production calls fall through to the real
  // one, built lazily so an unconfigured bucket only fails requests that
  // actually need it.
  bucket = getCaseFilesBucket(),
  // Same idea as `bucket`: fake it in tests, real client in production.
  prismaClient,
}) => {
  const client = prismaClient ?? (await getRealPrismaClient());

  const storagePath = await writeCaseFileObject({
    branchId: caseRecord.branch_id,
    caseId: caseRecord.id,
    employeeId: actor.employee_id,
    mimeType: file.mimetype,
    buffer: file.buffer,
    bucket,
  });

  try {
    return await client.caseFile.create({
      data: {
        case_id: caseRecord.id,
        branch_id: caseRecord.branch_id,
        storage_path: storagePath,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size_bytes: file.size,
        uploaded_by_id: actor.id,
        uploader_role: actor.role,
      },
    });
  } catch (dbError) {
    // The storage write already succeeded; a row-less object is unreachable
    // through this API but still a file nobody can account for.
    await bucket.remove([storagePath]).catch((cleanupError) => {
      console.error("createCaseFile: failed to clean up orphaned object", {
        case_id: caseRecord.id,
        cleanup_error: cleanupError?.message,
      });
    });
    throw dbError;
  }
};

// Same branch check as the upload path, keyed off the file's own branch_id
// snapshot — a signed link is only ever handed to someone who could also
// have read the case itself through the same scope rule.
export const loadCaseFileForRead = async (
  fileId,
  scopedBranchId,
  prismaClient,
) => {
  const client = prismaClient ?? (await getRealPrismaClient());
  const caseFile = await client.caseFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      case_id: true,
      branch_id: true,
      storage_path: true,
      original_name: true,
      mime_type: true,
      deleted_at: true,
    },
  });

  if (
    !caseFile ||
    caseFile.deleted_at ||
    !caseIsInScope(caseFile, scopedBranchId)
  ) {
    return null;
  }

  return caseFile;
};

export const createSignedUrlForCaseFile = async (
  storagePath,
  expiresInSeconds,
  bucket = getCaseFilesBucket(),
) => {
  const { data, error } = await bucket.createSignedUrl(
    storagePath,
    expiresInSeconds,
  );

  if (error) throw error;
  return data.signedUrl;
};
