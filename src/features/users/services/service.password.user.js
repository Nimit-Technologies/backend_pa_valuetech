import prisma from "../../../prisma/client.js";

export const getUserAuthById = (id) =>
  prisma.user.findUnique({
    where: { id },
    omit: { password: false },
  });

export const updateUserPassword = (
  id,
  hashedPassword,
  historyEntry,
  existingHistory = [],
) => {
  const currentHistory = Array.isArray(existingHistory) ? existingHistory : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  return prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      history: updatedHistory,
      token_version: { increment: 1 },
    },
    select: {
      id: true,
      employee_id: true,
      updated_at: true,
    },
  });
};
