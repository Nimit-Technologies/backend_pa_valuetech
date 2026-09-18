import prisma from "../../../prisma/client.js";
import { recordBranchTransition } from "../utils/branch-count.js";

// `existing` is the row as it was before this write (the controller already
// fetched it); it supplies both the history to append to and the "before"
// side of the count transition.
export const softDeleteBranch = async (id, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const branch = await prisma.branch.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      is_active: false,
      history: updatedHistory,
    },
  });

  // The row leaves the counted set: total -1, active -1 if it was active.
  recordBranchTransition(existing, branch);
  return branch;
};
