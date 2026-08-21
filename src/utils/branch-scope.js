import { isSuperAdminRole } from "../middlewares/authorize.js";

// Never a real cuid (see is-valid-cuid.js), so a filter/comparison against
// this can never match a real row. Used as the branch-admin scope when the
// caller's token is somehow missing a branch id, so that case fails closed
// (zero results / access denied) instead of falling through to "no filter".
const NO_BRANCH_SCOPE = "__no_branch_scope__";

/**
 * Branch-scoping for routes gated by `isAdmin` (super-admin OR
 * branch-admin) — "branch-admin" implies restriction to that admin's own
 * branch, which callers must apply explicitly since the middleware alone
 * doesn't enforce it.
 *
 * Returns `null` for a super-admin (unrestricted). Otherwise returns the
 * caller's own branch id to filter/compare against — falling back to an
 * unmatchable sentinel rather than `null`/`undefined` if it's missing, so a
 * malformed token can't be misread as "no restriction".
 *
 * Usage:
 *   const scope = resolveBranchScope(req);
 *   // list: if (scope) filter.branch_id = scope;
 *   // single record: if (scope && existing.branch_id !== scope) -> 404
 */
export const resolveBranchScope = (req) => {
  if (isSuperAdminRole(req)) return null;
  return req.user?.branch?.id || NO_BRANCH_SCOPE;
};
