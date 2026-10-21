import test from "node:test";
import assert from "node:assert/strict";

import { resolveEngineerBranch } from "../src/features/users/utils/engineer-branch-scope.js";

// GET /user/all-engineer is open to every authenticated session, so the branch
// rules below are the only thing keeping one branch out of another's staff
// directory. The Prisma filter itself (role "engineer" AND department
// "technical", active only) lives in the service and needs a database, so it is
// not covered here.

const NOIDA = { id: "cmuy2dooo000078p01eu5kfgn", name: "noida" };
const LUCKNOW = { id: "cmv7nmjdg0001i0p0tf8g56x6", name: "lucknow" };

// What resolveBranchScope returns for a non-super-admin with no branch.
const NO_BRANCH_SCOPE = "__no_branch_scope__";

test("a super admin naming no branch gets every branch", () => {
  // ownBranch is passed because a super admin has a branch of their own — and
  // the answer must still be "every branch", reported as no branch at all.
  // Omitting it here hid a bug where the response labelled an all-branch list
  // with the caller's own branch name.
  const result = resolveEngineerBranch({
    scopedBranchId: null,
    ownBranch: NOIDA,
  });

  assert.equal(result.error, undefined);
  assert.equal(result.branchId, null);
  assert.equal(result.branch, null);
});

test("a scoped caller naming no branch gets their own", () => {
  const result = resolveEngineerBranch({
    scopedBranchId: NOIDA.id,
    ownBranch: NOIDA,
  });

  assert.equal(result.error, undefined);
  assert.equal(result.branchId, NOIDA.id);
  assert.deepEqual(result.branch, { id: NOIDA.id, name: NOIDA.name });
});

test("a super admin may name any branch, by id or by name", () => {
  for (const named of [LUCKNOW.id, LUCKNOW.name]) {
    const result = resolveEngineerBranch({
      scopedBranchId: null,
      named,
      namedBranch: LUCKNOW,
    });

    assert.equal(result.error, undefined);
    assert.equal(result.branchId, LUCKNOW.id);
    assert.deepEqual(result.branch, { id: LUCKNOW.id, name: LUCKNOW.name });
  }
});

test("a scoped caller may name their own branch", () => {
  const result = resolveEngineerBranch({
    scopedBranchId: NOIDA.id,
    ownBranch: NOIDA,
    named: NOIDA.name,
    namedBranch: NOIDA,
  });

  assert.equal(result.error, undefined);
  assert.equal(result.branchId, NOIDA.id);
});

test("a scoped caller naming another branch is refused, not rescoped", () => {
  const result = resolveEngineerBranch({
    scopedBranchId: NOIDA.id,
    ownBranch: NOIDA,
    named: LUCKNOW.name,
    namedBranch: LUCKNOW,
  });

  assert.equal(result.error?.status, 403);
  // The refusal must not leak the other branch's engineers by falling through
  // to a query, nor quietly answer with noida's under lucknow's name.
  assert.equal(result.branchId, undefined);
});

test("an unknown branch is a 404 whoever asks", () => {
  for (const scopedBranchId of [null, NOIDA.id]) {
    const result = resolveEngineerBranch({
      scopedBranchId,
      ownBranch: scopedBranchId ? NOIDA : null,
      named: "delhi",
      namedBranch: null,
    });

    assert.equal(result.error?.status, 404);
  }
});

test("a session with no branch matches nothing rather than every branch", () => {
  // The sentinel must be carried into the query as-is: treating it as "no
  // filter" would hand a branchless session every engineer in the company.
  const result = resolveEngineerBranch({
    scopedBranchId: NO_BRANCH_SCOPE,
    ownBranch: null,
  });

  assert.equal(result.error, undefined);
  assert.equal(result.branchId, NO_BRANCH_SCOPE);
  assert.equal(result.branch, null);
});

test("a branchless session still cannot name a branch", () => {
  const result = resolveEngineerBranch({
    scopedBranchId: NO_BRANCH_SCOPE,
    named: NOIDA.name,
    namedBranch: NOIDA,
  });

  assert.equal(result.error?.status, 403);
});
