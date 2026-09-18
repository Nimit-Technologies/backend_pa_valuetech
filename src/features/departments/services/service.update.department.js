import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";
import { recordDepartmentTransition } from "../utils/department-count.js";

export const updateDepartment = async (id, data, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const department = await prisma.department.update({
    where: { id },
    data: {
      ...data,
      history: updatedHistory,
    },
    include: { branch: branchSelect },
  });

  // `data` may flip is_active; the transition works that out from the rows.
  recordDepartmentTransition(existing, department);
  return department;
};
