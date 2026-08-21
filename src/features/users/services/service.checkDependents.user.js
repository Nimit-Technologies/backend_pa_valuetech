import prisma from "../../../prisma/client.js";

// Unlike branch/department/role, a user's dependents aren't a simple single
// FK — Case reaches a user three ways (assigned, created_by, deleted_by),
// CaseUpdateHistory a fourth (updated_by), and Allocation two more
// (assigned, allocated_by). All six are onDelete: Restrict, and Case /
// CaseUpdateHistory keep an immutable audit snapshot of the acting user's
// identity — by design, any user who has ever touched a case or allocation
// stays permanently blocked from a hard delete; soft-delete is the intended
// way to remove them. Cases/allocations reached through more than one
// relation are deduped by id so the same record isn't listed twice.
export const getUserDependents = async (userId) => {
  const [
    assignedCases,
    createdCases,
    deletedCases,
    updatedCases,
    assignedAllocations,
    madeAllocations,
  ] = await Promise.all([
    prisma.case.findMany({
      where: { user_id: userId },
      select: { id: true, file_number: true },
    }),
    prisma.case.findMany({
      where: { created_by_id: userId },
      select: { id: true, file_number: true },
    }),
    prisma.case.findMany({
      where: { deleted_by_id: userId },
      select: { id: true, file_number: true },
    }),
    prisma.caseUpdateHistory.findMany({
      where: { updated_by_id: userId },
      select: { case: { select: { id: true, file_number: true } } },
    }),
    prisma.allocation.findMany({
      where: { user_id: userId },
      select: { id: true, case: { select: { file_number: true } } },
    }),
    prisma.allocation.findMany({
      where: { allocated_by_id: userId },
      select: { id: true, case: { select: { file_number: true } } },
    }),
  ]);

  const caseMap = new Map();
  for (const c of [...assignedCases, ...createdCases, ...deletedCases]) {
    caseMap.set(c.id, c.file_number);
  }
  for (const { case: c } of updatedCases) {
    caseMap.set(c.id, c.file_number);
  }
  const cases = [...caseMap].map(([id, file_number]) => ({ id, file_number }));

  const allocationMap = new Map();
  for (const a of [...assignedAllocations, ...madeAllocations]) {
    allocationMap.set(a.id, a.case?.file_number ?? null);
  }
  const allocations = [...allocationMap].map(([id, file_number]) => ({
    id,
    file_number,
  }));

  return { cases, allocations };
};
