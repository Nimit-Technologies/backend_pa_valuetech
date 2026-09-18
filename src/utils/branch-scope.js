import { isSuperAdminRole } from "../middlewares/authorize.js";

const NO_BRANCH_SCOPE = "__no_branch_scope__";

export const resolveBranchScope = (req) => {
  if (isSuperAdminRole(req)) return null;
  return req.user?.branch?.id || NO_BRANCH_SCOPE;
};
