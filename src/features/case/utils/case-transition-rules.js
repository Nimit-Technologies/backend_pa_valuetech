import {
  CASE_TRANSITIONS,
  CANCEL_FROM_ANY_NON_TERMINAL,
  REVERSE_CANCEL,
} from "../../../constant/case-transitions.js";
import { STATUS_CODE } from "../../../constant/case-status.js";

export const TRANSITION_DENIED = Object.freeze({
  NO_SUCH_EDGE: "no_such_edge",
  ROLE_NOT_ALLOWED: "role_not_allowed",
  REASON_REQUIRED: "reason_required",
});

// Resolves the rule for one requested move. Returns `{ ok: true }` or a reason
// the caller turns into a 403/409/400.
//
// Cancellation is handled as a wildcard rather than being listed on every
// status, so a workflow step added later does not silently become
// uncancellable.
export const checkTransition = ({ from, to, role, reason, isTerminalFrom }) => {
  if (from === to) {
    return { ok: false, denied: TRANSITION_DENIED.NO_SUCH_EDGE };
  }

  const edge =
    to === STATUS_CODE.CANCELLED && !isTerminalFrom
      ? CANCEL_FROM_ANY_NON_TERMINAL
      : (CASE_TRANSITIONS[from] ?? []).find((candidate) => candidate.to === to);

  if (!edge) {
    return { ok: false, denied: TRANSITION_DENIED.NO_SUCH_EDGE };
  }

  if (!edge.roles.includes(role)) {
    return { ok: false, denied: TRANSITION_DENIED.ROLE_NOT_ALLOWED };
  }

  if (edge.reasonRequired && !reason) {
    return { ok: false, denied: TRANSITION_DENIED.REASON_REQUIRED };
  }

  return { ok: true };
};

// Reversing a cancellation is not a free choice of target: the case goes back
// to whatever it was cancelled from. That status is not stored on the case —
// it is the `from_status` of the most recent cancelling history row, which is
// also how a held visit knows where to resume to.
export const checkCancelReversal = ({ role, reason }) => {
  if (!REVERSE_CANCEL.roles.includes(role)) {
    return { ok: false, denied: TRANSITION_DENIED.ROLE_NOT_ALLOWED };
  }

  if (REVERSE_CANCEL.reasonRequired && !reason) {
    return { ok: false, denied: TRANSITION_DENIED.REASON_REQUIRED };
  }

  return { ok: true };
};

export const resolveCancelReversalTarget = (updateHistory = []) => {
  const lastCancel = [...updateHistory]
    .reverse()
    .find(
      (entry) =>
        entry.action === "status_change" &&
        entry.to_status === STATUS_CODE.CANCELLED,
    );

  // Falls back to `open` when the history cannot say — a cancelled case with no
  // recorded cancelling transition predates this field or was seeded.
  return lastCancel?.from_status ?? STATUS_CODE.OPEN;
};
