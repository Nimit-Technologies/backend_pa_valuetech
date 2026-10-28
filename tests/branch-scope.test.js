import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveBranchScope,
  NO_BRANCH_SCOPE,
} from "../src/utils/branch-scope.js";
import { ROLE } from "../src/middlewares/authorize.js";

// resolveBranchScope decides what every branch-scoped endpoint is allowed to
// see. Three outcomes, and confusing any two of them crosses a branch
// boundary: null means every branch, an id means that branch, and the
// sentinel means nothing at all.

const BRANCH_ID = "cmuy2dooo000078p01eu5kfgn";

const req = (roleName, branchId) => ({
  user: {
    role: roleName === undefined ? undefined : { name: roleName },
    ...(branchId ? { branch: { id: branchId } } : {}),
  },
});

test("a super admin is scoped to every branch", () => {
  assert.equal(resolveBranchScope(req(ROLE.SUPER_ADMIN, BRANCH_ID)), null);
  // Even holding a branch of their own.
  assert.equal(resolveBranchScope(req(ROLE.SUPER_ADMIN, null)), null);
});

test("the super admin check ignores casing and padding", () => {
  // Role names come from database rows, not from this codebase.
  for (const name of ["Super Admin", "SUPER ADMIN", "  super admin  "]) {
    assert.equal(resolveBranchScope(req(name, BRANCH_ID)), null, name);
  }
});

test("everyone else is scoped to their own branch", () => {
  for (const role of [ROLE.BRANCH_ADMIN, ROLE.CORDINATOR, ROLE.ENGINEER]) {
    assert.equal(resolveBranchScope(req(role, BRANCH_ID)), BRANCH_ID, role);
  }
});

test("a session with no branch matches nothing, not everything", () => {
  // The failure this guards against is returning null here, which reads as
  // "every branch" downstream and hands a branchless session the whole
  // company's data.
  for (const broken of [
    req(ROLE.ENGINEER, null),
    req(undefined, null),
    { user: {} },
    {},
  ]) {
    assert.equal(resolveBranchScope(broken), NO_BRANCH_SCOPE);
  }
});

test("the sentinel is truthy and cannot be mistaken for a branch id", () => {
  // Callers branch on `if (scopedBranchId)` to mean "not a super admin". A
  // falsy sentinel would make a branchless session take the super admin path.
  assert.ok(NO_BRANCH_SCOPE);
  assert.equal(typeof NO_BRANCH_SCOPE, "string");
  assert.notEqual(NO_BRANCH_SCOPE, BRANCH_ID);
});
