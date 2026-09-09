import prisma from "../../../prisma/client.js";

export const setBranchStatus = (
  id,
  is_active,
  historyEntry,
  existingHistory = [],
) => {
  const currentHistory = Array.isArray(existingHistory) ? existingHistory : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  return prisma.branch.update({
    where: { id },
    data: {
      is_active,
      history: updatedHistory,
    },
  });
};
