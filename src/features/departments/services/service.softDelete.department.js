import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";
import { recordDepartmentTransition } from "../utils/department-count.js";

// `existing` is the row as it was before this write (the controller already
// fetched it); it supplies both the history to append to and the "before"
// side of the count transition.
export const softDeleteDepartment = async (id, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const department = await prisma.department.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      is_active: false,
      history: updatedHistory,
    },
    include: { branch: branchSelect },
  });

  // The row leaves the counted set: total -1, active -1 if it was active.
  recordDepartmentTransition(existing, department);
  return department;
};
