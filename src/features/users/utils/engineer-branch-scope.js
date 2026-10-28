import { NO_BRANCH_SCOPE } from "../../../utils/branch-scope.js";

// Which branch an engineer lookup answers for.
//
// Pure on purpose: the rules below are the whole authorization story for this
// endpoint, and keeping them out of the controller lets them be tested without
// a database or a request object (see tests/engineer-branch-scope.test.js).
//
// Inputs:
//   scopedBranchId  what resolveBranchScope(req) returned — null for a super
//                   admin, the caller's own branch id for everyone else, or the
//                   no-branch sentinel for a session with no branch at all.
//   ownBranch       the caller's own branch row, used only to label the answer.
//   named           the raw branch_id / branch the caller asked for, trimmed;
//                   empty when they asked for no particular branch.
//   namedBranch     the branch row `named` resolved to, or null if there is none.
//
// Returns { branchId, branch } to query with, or { error: { status, message } }.
// A null branchId means "every branch", which only a super admin can reach.
//
// `branch` is what the response labels the list with, and is null whenever the
// answer is not one branch: every branch, or none. Labelling an all-branch list
// with the caller's own branch — the obvious thing to do with ownBranch — reads
// as "these are noida's engineers" above a list of the whole company.
const describeBranch = (branch) =>
  branch?.id ? { id: branch.id, name: branch.name } : null;

export const resolveEngineerBranch = ({
  scopedBranchId = null,
  ownBranch = null,
  named = "",
  namedBranch = null,
} = {}) => {
  if (named && !namedBranch) {
    return { error: { status: 404, message: "Branch not found" } };
  }

  if (namedBranch) {
    // A branch-scoped caller may only ask about their own branch. Silently
    // rescoping them — the usual convention for an ignored filter — would
    // answer with one branch's engineers under another branch's name, which is
    // worse than refusing. The response does not say which branch it answered
    // for, which makes a quietly wrong scope undetectable by the caller.
    if (scopedBranchId && namedBranch.id !== scopedBranchId) {
      return {
        error: {
          status: 403,
          message:
            "Access denied. You can only view engineers in your own branch.",
        },
      };
    }

    return { branchId: namedBranch.id, branch: describeBranch(namedBranch) };
  }

  // Nothing named: a branch-scoped caller gets their own branch, a super admin
  // (null scope) gets every branch. A session carrying the no-branch sentinel
  // keeps it, so the query matches nothing rather than falling open.
  const isEveryBranch = scopedBranchId === null;
  const isBranchless = scopedBranchId === NO_BRANCH_SCOPE;

  return {
    branchId: scopedBranchId,
    branch: isEveryBranch || isBranchless ? null : describeBranch(ownBranch),
  };
};
