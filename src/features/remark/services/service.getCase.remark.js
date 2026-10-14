import prisma from "../../../prisma/client.js";

// Loads just enough of the case to authorize a remark: that it exists in the
// caller's branch, that it is not deleted, and whether its status has frozen
// it. Scoped in the query so a case in another branch reads as not found.
export const getCaseForRemark = (caseId, branchId) => {
  return prisma.case.findFirst({
    where: {
      id: caseId,
      ...(branchId && { branch_id: branchId }),
    },
    select: {
      id: true,
      branch_id: true,
      deleted_at: true,
      status: { select: { code: true, name: true, is_terminal: true } },
    },
  });
};
