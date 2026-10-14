import prisma from "../../../prisma/client.js";

// Both Case.status and Allocation.status are onDelete: Restrict, so either one
// blocks a hard delete. Cases are checked first and reported separately: a
// status in use by live cases is the common reason a delete is refused, and
// naming the file numbers tells the admin what to move before retrying.
//
// Soft-deleted rows still physically exist and still block the delete via the
// FK, so they must not be filtered out here.
export const getStatusDependents = async (statusId) => {
  const [cases, allocations] = await Promise.all([
    prisma.case.findMany({
      where: { status_id: statusId },
      select: { id: true, file_number: true },
    }),
    prisma.allocation.findMany({
      where: { status_id: statusId },
      select: { id: true, case_id: true },
    }),
  ]);

  return { cases, allocations };
};
