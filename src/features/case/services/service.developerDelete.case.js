import prisma from "../../../prisma/client.js";

// Unconditional hard delete — development only. See the controller for why
// this exists at all.
//
// Allocation.case and CaseUpdateHistory.case are both onDelete: Restrict, so
// a bare case.delete() fails with P2003 on any case that has ever been saved
// (create writes a history row). Both tables' rows belong to this case and
// nothing else, so they are cleared inside the same transaction: either the
// case and its children all go, or nothing does.
//
// Remark.case is onDelete: SetNull, so the DB detaches remarks on its own and
// they survive with case_id = null. Address, Bank, Branch, Status and User are
// all on the parent side of their relations and are left untouched.
export const developerDeleteCase = (id) => {
  return prisma.$transaction(async (tx) => {
    await tx.allocation.deleteMany({ where: { case_id: id } });
    await tx.caseUpdateHistory.deleteMany({ where: { case_id: id } });
    return tx.case.delete({ where: { id } });
  });
};
