import { ROLE } from "../middlewares/authorize.js";
import { STATUS_CODE } from "./case-status.js";

// Which role may move a case from which status to which.
//
// Defined here rather than in the database: the workflow is owned by code, not
// curated by an admin, and a route-level role guard cannot express it — an
// engineer may move visit_schedule -> visit_in_progress but not
// report_completed -> close. The transition endpoint checks this table itself.
//
// Roles are matched by name, the same way every guard in middlewares/authorize.js
// does. Role rows are per-department and therefore per-branch, so keying these
// rules to role_id would mean re-seeding the whole workflow for every new branch.
//
// sort_order is NOT the rule — backward edges are legitimate and enumerated
// below. Reading legality out of sort_order would make visit_hold impossible.

const ENGINEER = ROLE.ENGINEER;
const COORDINATION = [ROLE.CORDINATOR, ROLE.BRANCH_ADMIN];
const BRANCH_ADMIN_ONLY = [ROLE.BRANCH_ADMIN];

// The statuses an engineer works through on an assigned case. Within this set
// the engineer moves freely, in any direction — the field order is not
// strictly linear (holds, a second visit before reporting, correcting a
// mis-click), and the engineer's status dropdown offers exactly these. The
// lock that matters is the report: once it is submitted the engineer cannot
// change status at all (see engineer.reportLock.js, checked by the endpoint).
export const ENGINEER_STATUS_CODES = Object.freeze([
  STATUS_CODE.VISIT_SCHEDULE,
  STATUS_CODE.VISIT_HOLD,
  STATUS_CODE.VISIT_IN_PROGRESS,
  STATUS_CODE.VISIT_COMPLETED,
  STATUS_CODE.REPORT_IN_PROGRESS,
  STATUS_CODE.REPORT_COMPLETED,
]);

const engineerEdgesFrom = (from) =>
  ENGINEER_STATUS_CODES.filter((to) => to !== from).map((to) => ({
    to,
    roles: [ENGINEER],
  }));

// from -> [{ to, roles, reasonRequired }]
//
// One from/to pair may carry two edges with different roles (e.g. a
// coordinator's revisit needs a reason, the engineer's own move does not);
// checkTransition picks the edge that names the caller's role. Coordination
// edges are listed first.
export const CASE_TRANSITIONS = Object.freeze({
  [STATUS_CODE.OPEN]: [
    { to: STATUS_CODE.ASSIGNED_TO_ENGINEER, roles: COORDINATION },
  ],

  [STATUS_CODE.ASSIGNED_TO_ENGINEER]: [
    // Unassign — returns the case to the coordinator's queue.
    { to: STATUS_CODE.OPEN, roles: COORDINATION },
    ...engineerEdgesFrom(STATUS_CODE.ASSIGNED_TO_ENGINEER),
  ],

  [STATUS_CODE.VISIT_SCHEDULE]: engineerEdgesFrom(STATUS_CODE.VISIT_SCHEDULE),

  [STATUS_CODE.VISIT_HOLD]: engineerEdgesFrom(STATUS_CODE.VISIT_HOLD),

  [STATUS_CODE.VISIT_IN_PROGRESS]: engineerEdgesFrom(
    STATUS_CODE.VISIT_IN_PROGRESS,
  ),

  [STATUS_CODE.VISIT_COMPLETED]: [
    // Revisit — the site data was insufficient.
    {
      to: STATUS_CODE.VISIT_SCHEDULE,
      roles: COORDINATION,
      reasonRequired: true,
    },
    ...engineerEdgesFrom(STATUS_CODE.VISIT_COMPLETED),
  ],

  [STATUS_CODE.REPORT_IN_PROGRESS]: engineerEdgesFrom(
    STATUS_CODE.REPORT_IN_PROGRESS,
  ),

  [STATUS_CODE.REPORT_COMPLETED]: [
    // Rework — the report came back from review.
    {
      to: STATUS_CODE.REPORT_IN_PROGRESS,
      roles: COORDINATION,
      reasonRequired: true,
    },
    { to: STATUS_CODE.CLOSE, roles: COORDINATION },
    ...engineerEdgesFrom(STATUS_CODE.REPORT_COMPLETED),
  ],

  // Reopen. Branch admin only, and the reason is mandatory — a close followed
  // by a reopen with no explanation is the first thing an auditor asks about.
  [STATUS_CODE.CLOSE]: [
    {
      to: STATUS_CODE.REPORT_COMPLETED,
      roles: BRANCH_ADMIN_ONLY,
      reasonRequired: true,
    },
  ],

  // Reversing a cancellation lands back on whatever status it was cancelled
  // from, which the caller does not choose — see resolveCancelReversalTarget.
  [STATUS_CODE.CANCELLED]: [],
});

// Cancellation is reachable from every non-terminal status rather than being
// enumerated on each one, so a new workflow step does not silently become
// uncancellable.
export const CANCEL_FROM_ANY_NON_TERMINAL = Object.freeze({
  to: STATUS_CODE.CANCELLED,
  roles: COORDINATION,
  reasonRequired: true,
});

export const REVERSE_CANCEL = Object.freeze({
  roles: BRANCH_ADMIN_ONLY,
  reasonRequired: true,
});
