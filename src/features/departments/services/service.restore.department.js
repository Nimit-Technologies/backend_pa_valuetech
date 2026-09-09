import prisma from "../../../prisma/client.js";

export const restoreDepartment = (id, historyEntry, existingHistory = []) => {
  const currentHistory = Array.isArray(existingHistory) ? existingHistory : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  return prisma.department.update({
    where: { id },
    data: {
      deleted_at: null,
      is_active: true,
      history: updatedHistory,
    },
  });
};
