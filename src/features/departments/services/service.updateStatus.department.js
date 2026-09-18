import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";
import { recordDepartmentTransition } from "../utils/department-count.js";

export const setDepartmentStatus = async (
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

  const department = await prisma.department.update({
    where: { id },
    data: {
      is_active,
      history: updatedHistory,
    },
    include: { branch: branchSelect },
  });

  recordDepartmentTransition(existing, department);
  return department;
};
