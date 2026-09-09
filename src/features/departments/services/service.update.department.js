import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";

export const updateDepartment = (
  id,
  data,
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
      ...data,
      history: updatedHistory,
    },
    include: { branch: branchSelect },
  });
};
