import test from "node:test";
import assert from "node:assert/strict";

import { isAdmin, isAdminOrSelf } from "../src/middlewares/authorize.js";

// GET /user/:id backs the self-service profile pages, so a coordinator or
// engineer must be able to read their own row — and nobody else's. These cover
// the guard only; the branch filter that stops a branch admin reading across
// branches lives in the controller (resolveBranchScope) and is not tested here.

const SELF_ID = "cmqrwx8h100037op0k58k9zkm";
const OTHER_ID = "cmqruschc0000wcp08mmcr53u";

const user = (roleName, departmentName = "management") => ({
  id: SELF_ID,
  role: { name: roleName },
  department: { name: departmentName },
  branch: { id: "cmqruvoi80001xop0f62x2232" },
});

// Returns "allowed" or the status code the middleware denied with.
const run = (middleware, { user: reqUser, id }) => {
  const req = { user: reqUser, params: { id } };
  let result = "no-response";
  const res = {
    status: (code) => ({
      json: () => {
        result = code;
      },
    }),
  };

  middleware(req, res, () => {
    result = "allowed";
  });

  return result;
};

test("isAdminOrSelf lets any authenticated user read their own row", () => {
  for (const roleName of [
    "super admin",
    "branch admin",
    "cordinator",
    "engineer",
  ]) {
    assert.equal(
      run(isAdminOrSelf, { user: user(roleName), id: SELF_ID }),
      "allowed",
      `${roleName} should be able to read their own row`,
    );
  }
});

test("isAdminOrSelf still denies non-admins another user's row", () => {
  for (const roleName of ["cordinator", "engineer"]) {
    assert.equal(
      run(isAdminOrSelf, { user: user(roleName), id: OTHER_ID }),
      403,
      `${roleName} should not be able to read someone else's row`,
    );
  }
});

test("isAdminOrSelf keeps admin access to another user's row", () => {
  for (const roleName of ["super admin", "branch admin"]) {
    assert.equal(
      run(isAdminOrSelf, { user: user(roleName), id: OTHER_ID }),
      "allowed",
      `${roleName} should keep cross-user read access`,
    );
  }
});

test("isAdminOrSelf does not treat a missing id as self", () => {
  // A request with no :id must never match the self branch, whatever the
  // session looks like — including a session with no id of its own.
  assert.equal(
    run(isAdminOrSelf, { user: user("cordinator"), id: undefined }),
    403,
  );
  assert.equal(
    run(isAdminOrSelf, {
      user: { role: { name: "cordinator" } },
      id: undefined,
    }),
    403,
  );
});

test("isAdmin itself is unchanged", () => {
  assert.equal(
    run(isAdmin, { user: user("super admin"), id: SELF_ID }),
    "allowed",
  );
  assert.equal(
    run(isAdmin, { user: user("branch admin"), id: SELF_ID }),
    "allowed",
  );
  assert.equal(run(isAdmin, { user: user("cordinator"), id: SELF_ID }), 403);
  assert.equal(run(isAdmin, { user: user("engineer"), id: SELF_ID }), 403);
});
