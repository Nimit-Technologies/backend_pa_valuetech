import prisma from "../../../prisma/client.js";
import {
  departmentSelect,
  branchSelect,
  shapeRole,
} from "./role.service.helpers.js";

export const updateRole = async (
  id,
  data,
  historyEntry,
  existingHistory = [],
) => {
  const currentHistory = Array.isArray(existingHistory) ? existingHistory : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const role = await prisma.role.update({
    where: { id },
    data: {
      ...data,
      history: updatedHistory,
    },
    include: {
      department: departmentSelect,
      branch: branchSelect,
    },
  });

  return shapeRole(role);
};
