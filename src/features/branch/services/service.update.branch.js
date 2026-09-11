import prisma from "../../../prisma/client.js";
import { recordBranchTransition } from "../utils/branch-count.js";

export const updateBranch = async (id, data, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const branch = await prisma.branch.update({
    where: { id },
    data: {
      ...data,
      history: updatedHistory,
    },
  });

  // `data` may flip is_active; the transition works that out from the rows.
  recordBranchTransition(existing, branch);
  return branch;
};
