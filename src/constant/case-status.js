export const STATUS_CODE = Object.freeze({
  OPEN: "open",
  ASSIGNED_TO_ENGINEER: "assigned_to_engineer",
  VISIT_SCHEDULE: "visit_schedule",
  VISIT_HOLD: "visit_hold",
  VISIT_IN_PROGRESS: "visit_in_progress",
  VISIT_COMPLETED: "visit_completed",
  REPORT_IN_PROGRESS: "report_in_progress",
  REPORT_COMPLETED: "report_completed",
  CLOSE: "close",
  CANCELLED: "cancelled",
});

export const SYSTEM_STATUSES = Object.freeze([
  { code: STATUS_CODE.OPEN, name: "open", sort_order: 10 },
  {
    code: STATUS_CODE.ASSIGNED_TO_ENGINEER,
    name: "assigned to engineer",
    sort_order: 20,
  },
  { code: STATUS_CODE.VISIT_SCHEDULE, name: "visit schedule", sort_order: 30 },
  { code: STATUS_CODE.VISIT_HOLD, name: "visit hold", sort_order: 40 },
  {
    code: STATUS_CODE.VISIT_IN_PROGRESS,
    name: "visit in progress",
    sort_order: 50,
  },
  {
    code: STATUS_CODE.VISIT_COMPLETED,
    name: "visit completed",
    sort_order: 60,
  },
  {
    code: STATUS_CODE.REPORT_IN_PROGRESS,
    name: "report in progress",
    sort_order: 70,
  },
  {
    code: STATUS_CODE.REPORT_COMPLETED,
    name: "report completed",
    sort_order: 80,
  },
  { code: STATUS_CODE.CLOSE, name: "close", sort_order: 90, is_terminal: true },
  {
    code: STATUS_CODE.CANCELLED,
    name: "cancelled",
    sort_order: 100,
    is_terminal: true,
  },
]);

// The status every new case starts in when no engineer is named up front.
export const INITIAL_STATUS_CODE = STATUS_CODE.OPEN;

// Terminal states are read from Status.is_terminal at runtime, not from this
// list — a super admin may add an eleventh terminal status. These are here only
// for the seed and for tests.
export const TERMINAL_STATUS_CODES = Object.freeze([
  STATUS_CODE.CLOSE,
  STATUS_CODE.CANCELLED,
]);

const SYSTEM_STATUS_CODES = new Set(SYSTEM_STATUSES.map(({ code }) => code));

// Seeded statuses are referenced by the transition rules, so they may be
// renamed or deactivated but never deleted — removing one would leave an edge
// pointing at nothing.
export const isSystemStatusCode = (code) => SYSTEM_STATUS_CODES.has(code);
