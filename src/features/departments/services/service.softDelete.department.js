import prisma from "../../../prisma/client.js";

export const softDeleteDepartment = (
  id,
  historyEntry,
  existingHistory = [],
) => {
  const currentHistory = Array.isArray(existingHistory) ? existingHistory : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  return prisma.department.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      is_active: false,
      history: updatedHistory,
    },
  });
};
