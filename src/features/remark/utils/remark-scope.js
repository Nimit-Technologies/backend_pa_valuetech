import { isSuperAdminRole } from "../../../middlewares/authorize.js";

// Remarks are public within the branch.
//
// This is deliberately looser than resolveCaseScope: any user in the branch may
// read and write remarks on any case in that branch, whether or not they can
// see the case itself. So `GET /remark/:caseId` will return data for a case that
// `GET /case/:id` answers 404 for, for the same caller — business-type
// isolation covers case records, not case commentary.
//
// It looks like a bug when the two controllers are read side by side, hence this
// note. What it is NOT is unscoped: the branch boundary still applies, and
// access requires the case id, so there is no branch-wide remark feed to
// enumerate.
const NO_BRANCH_SCOPE = "__no_branch_scope__";

export const resolveRemarkBranchScope = (req) => {
  if (isSuperAdminRole(req)) return null;
  return req.user?.branch?.id || NO_BRANCH_SCOPE;
};
