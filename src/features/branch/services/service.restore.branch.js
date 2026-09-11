import prisma from "../../../prisma/client.js";
import { recordBranchTransition } from "../utils/branch-count.js";

export const restoreBranch = async (id, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const branch = await prisma.branch.update({
    where: { id },
    data: {
      deleted_at: null,
      is_active: true,
      history: updatedHistory,
    },
  });

  // The row re-enters the counted set as active: total +1, active +1.
  recordBranchTransition(existing, branch);
  return branch;
};
