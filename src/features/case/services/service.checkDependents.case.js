import prisma from "../../../prisma/client.js";

// Allocations are the only hard blocker on deleting a case: the relation is
// onDelete: Restrict and an allocation is a workflow stage that belongs to the
// case's history, not something to silently discard.
export const getCaseDependents = async (caseId) => {
  const allocations = await prisma.allocation.findMany({
    where: { case_id: caseId },
    select: {
      id: true,
      sequence: true,
      user: { select: { id: true, first_name: true, last_name: true } },
    },
    orderBy: { sequence: "asc" },
  });

  return { allocations };
};
