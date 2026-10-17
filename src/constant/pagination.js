import { CREDENTIALS } from "./credentials.js";

export const PAGINATION_DIRECTION = Object.freeze({
  NEXT: "next",
  PREVIOUS: "previous",
});

// Page size for the cursor-paginated lists. The client never sends a limit:
// paging policy belongs to the server, and a client-chosen size is one more
// thing to validate on every request.
export const DEFAULT_DATA_LIMIT = 10;

// Falls back rather than trusting the env blindly: an unset or non-numeric
// DATA_LIMIT would otherwise reach Prisma as `take: NaN`, which throws on every
// list request.
//
// Nothing outside this module should read CREDENTIALS.DATA_LIMIT directly.
export const resolveDataLimit = () => {
  const parsed = Number.parseInt(`${CREDENTIALS.DATA_LIMIT}`, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_DATA_LIMIT;
};

// Resolved once at import, since the env cannot change under a running
// process. Every cursor-paginated list (user, branch, department, bank,
// business type, case, role, remark) binds to this; the similar-case search
// calls resolveDataLimit() per request instead, because it clamps the value to
// its own ceiling.
export const DATA_LIMIT = resolveDataLimit();
