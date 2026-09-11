import prisma from "../../../prisma/client.js";
import { recordBranchTransition } from "../utils/branch-count.js";

export const setBranchStatus = async (
  id,
  is_active,
  historyEntry,
  existing,
) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const branch = await prisma.branch.update({
    where: { id },
    data: {
      is_active,
      history: updatedHistory,
    },
  });

  recordBranchTransition(existing, branch);
  return branch;
};
