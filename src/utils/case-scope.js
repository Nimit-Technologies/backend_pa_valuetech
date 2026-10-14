import {
  isSuperAdminRole,
  isBranchAdminRole,
  isCoordinatorRole,
} from "../middlewares/authorize.js";

// Who can see which cases. Three tiers, resolved from the caller's role:
//
//   super admin   no filter
//   branch admin  own branch, every business type
//   coordinator   own branch AND own business type
//   anyone else   only cases assigned to them (engineer / drafter)
//
// Returned as a Prisma `where` fragment so the filter is applied in the query
// itself. A case outside the caller's scope is never fetched and then
// discarded; it simply does not exist for them, and comes back as a plain 404
// rather than a 403 that would confirm it exists.
//
// Every branch fails closed. A coordinator with no business type, or a user
// with no branch, matches the impossible sentinel below rather than falling
// through to an unfiltered query.
const NO_SCOPE = "__no_case_scope__";

export const CASE_SCOPE = Object.freeze({
  ALL: "all",
  BRANCH: "branch",
  BUSINESS_TYPE: "business_type",
  ASSIGNED: "assigned",
});

export const resolveCaseScope = (req) => {
  if (isSuperAdminRole(req)) {
    return { tier: CASE_SCOPE.ALL, where: {} };
  }

  const branchId = req.user?.branch?.id || NO_SCOPE;

  if (isBranchAdminRole(req)) {
    return { tier: CASE_SCOPE.BRANCH, where: { branch_id: branchId } };
  }

  if (isCoordinatorRole(req)) {
    // business_type_id rides in the JWT (see buildTokenPayload). A coordinator
    // created without one is a misconfigured account, not an unrestricted one.
    return {
      tier: CASE_SCOPE.BUSINESS_TYPE,
      where: {
        branch_id: branchId,
        business_type_id: req.user?.business_type_id || NO_SCOPE,
      },
    };
  }

  // Engineers and drafters see only their own assignments. The branch filter is
  // redundant — a case's employee must belong to the case's branch — but it is
  // kept so branch isolation does not depend on that invariant holding.
  return {
    tier: CASE_SCOPE.ASSIGNED,
    where: {
      branch_id: branchId,
      employee_id: req.user?.employee_id || NO_SCOPE,
    },
  };
};

// True when the caller owns the case record itself rather than merely being
// assigned to it — the two roles allowed to create and edit case data.
export const canEditCaseData = (req) =>
  isSuperAdminRole(req) || isBranchAdminRole(req) || isCoordinatorRole(req);
