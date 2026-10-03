import prisma from "../../../prisma/client.js";
import { recordCaseTransition } from "../utils/case-count.js";

export const deleteCase = async (id) => {
  const caseRecord = await prisma.$transaction(async (tx) => {
    // CaseUpdateHistory.case is onDelete: Restrict, so the case's own audit
    // rows have to go first — they belong to this case and nothing else.
    // Allocations are Restrict too, but they are a real dependency and are
    // refused up front by the controller rather than deleted here. Remarks are
    // SetNull, so the DB detaches them on its own.
    await tx.caseUpdateHistory.deleteMany({ where: { case_id: id } });
    return tx.case.delete({ where: { id } });
  });

  // Prisma returns the row as it was, which is the "before" side of the
  // transition. A row that was already soft-deleted was not counted, so
  // hard-deleting it moves nothing.
  recordCaseTransition(caseRecord, null);
  return caseRecord;
};
