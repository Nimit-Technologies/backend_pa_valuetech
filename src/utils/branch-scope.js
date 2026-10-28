import { isSuperAdminRole } from "../middlewares/authorize.js";

// Matches no branch rather than every branch — the filter a session with no
// branch of its own is scoped to. Exported so callers can tell it apart from a
// real branch id instead of re-declaring the literal.
export const NO_BRANCH_SCOPE = "__no_branch_scope__";

export const resolveBranchScope = (req) => {
  if (isSuperAdminRole(req)) return null;
  return req.user?.branch?.id || NO_BRANCH_SCOPE;
};
