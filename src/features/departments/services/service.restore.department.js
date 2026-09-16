import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";
import { recordDepartmentTransition } from "../utils/department-count.js";

export const restoreDepartment = async (id, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const department = await prisma.department.update({
    where: { id },
    data: {
      deleted_at: null,
      is_active: true,
      history: updatedHistory,
    },
    include: { branch: branchSelect },
  });

  // The row re-enters the counted set as active: total +1, active +1.
  recordDepartmentTransition(existing, department);
  return department;
};
