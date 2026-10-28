import test from "node:test";
import assert from "node:assert/strict";

import {
  CASE_TRANSITIONS,
  CANCEL_FROM_ANY_NON_TERMINAL,
  REVERSE_CANCEL,
} from "../src/constant/case-transitions.js";
import {
  STATUS_CODE,
  TERMINAL_STATUS_CODES,
  INITIAL_STATUS_CODE,
} from "../src/constant/case-status.js";
import { ROLE } from "../src/middlewares/authorize.js";

// This table is the workflow's authorization model — which role may move a
// case from which status to which. A route-level guard cannot express it, so
// nothing else checks these invariants.

const KNOWN_STATUSES = new Set(Object.values(STATUS_CODE));
const KNOWN_ROLES = new Set(Object.values(ROLE));

const everyEdge = function* () {
  for (const [from, edges] of Object.entries(CASE_TRANSITIONS)) {
    for (const edge of edges) yield { from, ...edge };
  }
};

test("every status in the table is a real status code", () => {
  for (const from of Object.keys(CASE_TRANSITIONS)) {
    assert.ok(KNOWN_STATUSES.has(from), `unknown from-status: ${from}`);
  }
  for (const { from, to } of everyEdge()) {
    assert.ok(KNOWN_STATUSES.has(to), `unknown to-status: ${from} -> ${to}`);
  }
});

test("every status code appears in the table", () => {
  // A status missing from the table is a case that can enter a state and
  // never leave it, with no error to say so.
  for (const code of KNOWN_STATUSES) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(CASE_TRANSITIONS, code),
      `${code} has no entry, so a case there cannot move`,
    );
  }
});

test("every edge names at least one real role", () => {
  for (const { from, to, roles } of everyEdge()) {
    assert.ok(Array.isArray(roles) && roles.length > 0, `${from} -> ${to}`);
    for (const role of roles) {
      assert.ok(
        KNOWN_ROLES.has(role),
        `unknown role "${role}" on ${from} -> ${to}`,
      );
    }
  }
});

test("no edge moves a case straight to cancelled", () => {
  // Cancellation comes from CANCEL_FROM_ANY_NON_TERMINAL so that a new
  // workflow step cannot silently become uncancellable. An enumerated edge
  // would mean two paths to the same place with different rules.
  for (const { from, to } of everyEdge()) {
    assert.notEqual(to, STATUS_CODE.CANCELLED, `${from} enumerates cancelled`);
  }
});

test("every status except cancelled is reachable from the initial status", () => {
  const seen = new Set([INITIAL_STATUS_CODE]);
  const queue = [INITIAL_STATUS_CODE];

  while (queue.length > 0) {
    for (const { to } of CASE_TRANSITIONS[queue.shift()] ?? []) {
      if (!seen.has(to)) {
        seen.add(to);
        queue.push(to);
      }
    }
  }

  for (const code of KNOWN_STATUSES) {
    if (code === STATUS_CODE.CANCELLED) continue;
    assert.ok(
      seen.has(code),
      `${code} is unreachable from ${INITIAL_STATUS_CODE}`,
    );
  }
});

test("cancelled is a dead end in the table", () => {
  // Reversal lands on whatever it was cancelled from, which the caller does
  // not choose, so it cannot be expressed as an edge here.
  assert.deepEqual(CASE_TRANSITIONS[STATUS_CODE.CANCELLED], []);
});

test("leaving a terminal status always needs a reason", () => {
  for (const terminal of TERMINAL_STATUS_CODES) {
    for (const edge of CASE_TRANSITIONS[terminal] ?? []) {
      assert.equal(
        edge.reasonRequired,
        true,
        `${terminal} -> ${edge.to} must record why`,
      );
    }
  }
});

test("reopening a closed case is branch admin only, with a reason", () => {
  const [reopen, ...rest] = CASE_TRANSITIONS[STATUS_CODE.CLOSE];

  assert.equal(rest.length, 0);
  assert.equal(reopen.to, STATUS_CODE.REPORT_COMPLETED);
  assert.deepEqual(reopen.roles, [ROLE.BRANCH_ADMIN]);
  assert.equal(reopen.reasonRequired, true);
});

test("the backward edges that undo work demand a reason", () => {
  const edgeFrom = (from, to) =>
    CASE_TRANSITIONS[from].find((edge) => edge.to === to);

  // Revisit: the site data was insufficient.
  assert.equal(
    edgeFrom(STATUS_CODE.VISIT_COMPLETED, STATUS_CODE.VISIT_SCHEDULE)
      .reasonRequired,
    true,
  );
  // Rework: the report came back from review.
  assert.equal(
    edgeFrom(STATUS_CODE.REPORT_COMPLETED, STATUS_CODE.REPORT_IN_PROGRESS)
      .reasonRequired,
    true,
  );
});

test("an engineer cannot close, reopen or cancel a case", () => {
  const closing = CASE_TRANSITIONS[STATUS_CODE.REPORT_COMPLETED].find(
    (edge) => edge.to === STATUS_CODE.CLOSE,
  );

  assert.ok(!closing.roles.includes(ROLE.ENGINEER));
  assert.ok(
    !CASE_TRANSITIONS[STATUS_CODE.CLOSE][0].roles.includes(ROLE.ENGINEER),
  );
  assert.ok(!CANCEL_FROM_ANY_NON_TERMINAL.roles.includes(ROLE.ENGINEER));
  assert.ok(!REVERSE_CANCEL.roles.includes(ROLE.ENGINEER));
});

test("the cancel rules are shaped like the edges they stand in for", () => {
  assert.equal(CANCEL_FROM_ANY_NON_TERMINAL.to, STATUS_CODE.CANCELLED);
  assert.equal(CANCEL_FROM_ANY_NON_TERMINAL.reasonRequired, true);
  assert.ok(CANCEL_FROM_ANY_NON_TERMINAL.roles.length > 0);

  assert.deepEqual(REVERSE_CANCEL.roles, [ROLE.BRANCH_ADMIN]);
  assert.equal(REVERSE_CANCEL.reasonRequired, true);
});

test("the tables are frozen", () => {
  // They are shared module state; a stray write would re-author the workflow
  // for every later request in the process.
  assert.ok(Object.isFrozen(CASE_TRANSITIONS));
  assert.ok(Object.isFrozen(CANCEL_FROM_ANY_NON_TERMINAL));
  assert.ok(Object.isFrozen(REVERSE_CANCEL));
});
