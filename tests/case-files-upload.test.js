import test from "node:test";
import assert from "node:assert/strict";

import {
  createCaseFile,
  loadCaseForUpload,
  loadCaseFileForRead,
  createSignedUrlForCaseFile,
} from "../src/features/uploads/uploads.service.js";
import { caseFileFilter } from "../src/features/uploads/utils/case-file-filter.js";

// Every scenario below exercises the real orchestration logic (collision
// retry, branch-scope matching, cleanup-on-failure) with both I/O boundaries
// faked — the Supabase Storage bucket and the Prisma client are both
// injectable (see uploads.service.js). That means these run with no network
// and no database, same as every other test `npm test` runs: this repo
// deliberately keeps DB- and network-dependent checks out of the automated
// suite (see the pg_trgm similarity search, verified separately) rather than
// pointing it at whatever database happens to be configured in .env.
//
// What is NOT covered here, because it needs the real services: that
// Supabase Storage actually rejects a second write to the same key (bucket.
// upload's upsert:false contract is trusted, not re-verified), and the real
// shape of a signed URL. Both should be exercised once against a disposable
// Supabase project before this ships.

const CASE_ID = "cmv7nmjdg0001i0p0tf8g56x6";
const NOIDA_ID = "cmuy2dooo000078p01eu5kfgn";
const LUCKNOW_ID = "cmv8z9k0n0002i0p0a1b2c3d4";

const actor = { id: "user_1", employee_id: "emp05", role: "engineer" };
const file = {
  mimetype: "image/jpeg",
  buffer: Buffer.from("fake-bytes"),
  originalname: "site-photo.jpg",
  size: 10,
};

// Supabase's own storage errors are real Error instances (StorageError
// extends Error), not plain objects — matched here so a fake "already
// exists" or "unavailable" response behaves the way assert.rejects (and
// isConflictError's own error.message check) expects of the real client.
const storageError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const makeFakeBucket = (uploadOutcomes = [{ error: null }]) => {
  const calls = { upload: [], remove: [] };
  let i = 0;
  return {
    calls,
    upload: async (path, buffer, opts) => {
      calls.upload.push({ path, opts });
      const outcome = uploadOutcomes[Math.min(i, uploadOutcomes.length - 1)];
      i++;
      return outcome;
    },
    remove: async (paths) => {
      calls.remove.push(paths);
      return { data: paths, error: null };
    },
    createSignedUrl: async (path, expiresIn) => ({
      data: { signedUrl: `https://storage.test/${path}?expires=${expiresIn}` },
      error: null,
    }),
  };
};

const fakePrismaCreating = () => {
  let inserted;
  return {
    prismaClient: {
      caseFile: {
        create: async ({ data }) => {
          inserted = data;
          return { id: "file_1", uploaded_at: new Date(), ...data };
        },
      },
    },
    getInserted: () => inserted,
  };
};

test("uploads the first file under <branch_id>/<case_id>/<employee_id>_<case_id>.<ext>", async () => {
  const bucket = makeFakeBucket([{ error: null }]);
  const { prismaClient, getInserted } = fakePrismaCreating();
  const caseRecord = { id: CASE_ID, branch_id: NOIDA_ID };

  const result = await createCaseFile({
    caseRecord,
    actor,
    file,
    bucket,
    prismaClient,
  });

  const expectedKey = `${NOIDA_ID}/${CASE_ID}/emp05_${CASE_ID}.jpg`;
  assert.equal(bucket.calls.upload.length, 1);
  assert.equal(bucket.calls.upload[0].path, expectedKey);
  assert.equal(bucket.calls.upload[0].opts.upsert, false);
  assert.equal(bucket.calls.upload[0].opts.contentType, "image/jpeg");
  assert.equal(getInserted().storage_path, expectedKey);
  assert.equal(getInserted().branch_id, NOIDA_ID);
  assert.equal(getInserted().case_id, CASE_ID);
  assert.equal(getInserted().uploaded_by_id, actor.id);
  assert.equal(getInserted().uploader_role, actor.role);
  assert.equal(result.id, "file_1");
});

test("a second upload by the same employee to the same case gets a random-suffixed name, never overwriting", async () => {
  const bucket = makeFakeBucket([
    { error: storageError(409, "The resource already exists") },
    { error: null },
  ]);
  const { prismaClient } = fakePrismaCreating();
  const caseRecord = { id: CASE_ID, branch_id: NOIDA_ID };

  await createCaseFile({ caseRecord, actor, file, bucket, prismaClient });

  assert.equal(bucket.calls.upload.length, 2);
  const [firstAttempt, secondAttempt] = bucket.calls.upload;
  assert.equal(
    firstAttempt.path,
    `${NOIDA_ID}/${CASE_ID}/emp05_${CASE_ID}.jpg`,
  );
  assert.match(
    secondAttempt.path,
    new RegExp(`^${NOIDA_ID}/${CASE_ID}/emp05_${CASE_ID}_[a-z0-9]{4}\\.jpg$`),
  );
  assert.notEqual(secondAttempt.path, firstAttempt.path);
  // Neither attempt ever asked storage to overwrite.
  assert.ok(bucket.calls.upload.every((c) => c.opts.upsert === false));
});

test("a non-conflict storage error aborts immediately and never reaches the database", async () => {
  const bucket = makeFakeBucket([
    { error: storageError(500, "storage is unavailable") },
  ]);
  let dbTouched = false;
  const prismaClient = {
    caseFile: {
      create: async () => {
        dbTouched = true;
      },
    },
  };
  const caseRecord = { id: CASE_ID, branch_id: NOIDA_ID };

  await assert.rejects(
    () => createCaseFile({ caseRecord, actor, file, bucket, prismaClient }),
    /storage is unavailable/,
  );
  assert.equal(dbTouched, false);
});

test("when the database insert fails after a successful write, the object is removed and the error is rethrown", async () => {
  const bucket = makeFakeBucket([{ error: null }]);
  const dbError = new Error("simulated foreign key violation");
  const prismaClient = {
    caseFile: {
      create: async () => {
        throw dbError;
      },
    },
  };
  const caseRecord = { id: CASE_ID, branch_id: NOIDA_ID };

  await assert.rejects(
    () => createCaseFile({ caseRecord, actor, file, bucket, prismaClient }),
    (err) => err === dbError,
  );

  assert.equal(bucket.calls.remove.length, 1);
  assert.deepEqual(bucket.calls.remove[0], [
    `${NOIDA_ID}/${CASE_ID}/emp05_${CASE_ID}.jpg`,
  ]);
});

test("loadCaseForUpload returns the case when the caller's branch matches", async () => {
  const prismaClient = {
    case: {
      findUnique: async () => ({
        id: CASE_ID,
        branch_id: NOIDA_ID,
        deleted_at: null,
      }),
    },
  };

  const result = await loadCaseForUpload(CASE_ID, NOIDA_ID, prismaClient);
  assert.equal(result?.id, CASE_ID);
});

test("loadCaseForUpload returns null for a case in a branch the caller cannot reach", async () => {
  // A noida-branch caller naming a case that lives in lucknow — the write
  // this guards against is leaking which case ids exist outside the branch.
  const prismaClient = {
    case: {
      findUnique: async () => ({
        id: "case_44",
        branch_id: LUCKNOW_ID,
        deleted_at: null,
      }),
    },
  };

  const result = await loadCaseForUpload("case_44", NOIDA_ID, prismaClient);
  assert.equal(result, null);
});

test("loadCaseForUpload ignores the branch filter for a super admin (null scope)", async () => {
  const prismaClient = {
    case: {
      findUnique: async () => ({
        id: "case_44",
        branch_id: LUCKNOW_ID,
        deleted_at: null,
      }),
    },
  };

  const result = await loadCaseForUpload("case_44", null, prismaClient);
  assert.equal(result?.id, "case_44");
});

test("loadCaseForUpload returns null when the case does not exist", async () => {
  const prismaClient = { case: { findUnique: async () => null } };
  const result = await loadCaseForUpload("missing", NOIDA_ID, prismaClient);
  assert.equal(result, null);
});

test("loadCaseFileForRead applies the same branch check as the upload path", async () => {
  const prismaClient = {
    caseFile: {
      findUnique: async () => ({
        id: "file_1",
        case_id: CASE_ID,
        branch_id: LUCKNOW_ID,
        storage_path: "x",
        deleted_at: null,
      }),
    },
  };

  assert.equal(
    await loadCaseFileForRead("file_1", NOIDA_ID, prismaClient),
    null,
  );
  assert.equal(
    (await loadCaseFileForRead("file_1", LUCKNOW_ID, prismaClient))?.id,
    "file_1",
  );
});

test("loadCaseFileForRead treats a soft-deleted file as not found", async () => {
  const prismaClient = {
    caseFile: {
      findUnique: async () => ({
        id: "file_1",
        case_id: CASE_ID,
        branch_id: NOIDA_ID,
        storage_path: "x",
        deleted_at: new Date(),
      }),
    },
  };

  const result = await loadCaseFileForRead("file_1", NOIDA_ID, prismaClient);
  assert.equal(result, null);
});

test("createSignedUrlForCaseFile returns the bucket's signed URL and rejects on error", async () => {
  const bucket = makeFakeBucket();
  const url = await createSignedUrlForCaseFile("a/b/c.jpg", 300, bucket);
  assert.equal(url, "https://storage.test/a/b/c.jpg?expires=300");

  const failingBucket = {
    createSignedUrl: async () => ({
      data: null,
      error: new Error("object not found"),
    }),
  };
  await assert.rejects(
    () => createSignedUrlForCaseFile("a/b/c.jpg", 300, failingBucket),
    /object not found/,
  );
});

test("caseFileFilter accepts every allowed MIME type and rejects anything else", () => {
  for (const mimetype of [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]) {
    caseFileFilter(null, { mimetype }, (err, ok) => {
      assert.equal(err, null);
      assert.equal(ok, true);
    });
  }

  // photo.exe sent with a disallowed MIME type is rejected before multer
  // ever buffers it — nothing is written for the rejection cases this guards.
  caseFileFilter(null, { mimetype: "application/x-msdownload" }, (err) => {
    assert.ok(err);
    assert.equal(err.statusCode, 400);
  });
});
