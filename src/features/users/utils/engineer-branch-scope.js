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
//   named           the raw branch_id / branch the caller asked for, trimmed;
//                   empty when they asked for no particular branch.
//   namedBranch     the branch row `named` resolved to, or null if there is none.
//
// Returns { branchId } to query with, or { error: { status, message } }.
// A null branchId means "every branch", which only a super admin can reach.
export const resolveEngineerBranch = ({
  scopedBranchId = null,
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

    return { branchId: namedBranch.id };
  }

  // Nothing named: a branch-scoped caller gets their own branch, a super admin
  // (null scope) gets every branch. A session carrying the no-branch sentinel
  // keeps it, so the query matches nothing rather than falling open.
  return { branchId: scopedBranchId };
};
