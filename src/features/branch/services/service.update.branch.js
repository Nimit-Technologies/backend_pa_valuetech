import prisma from "../../../prisma/client.js";

export const updateBranch = (id, name, historyEntry, existingHistory = []) => {
  const currentHistory = Array.isArray(existingHistory) ? existingHistory : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  return prisma.branch.update({
    where: { id },
    data: {
      name,
      history: updatedHistory,
    },
  });
};
