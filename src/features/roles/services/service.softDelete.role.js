import prisma from "../../../prisma/client.js";
import {
  departmentSelect,
  branchSelect,
  shapeRole,
} from "./role.service.helpers.js";
import { recordRoleTransition } from "../utils/role-count.js";

// `existing` is the row as it was before this write (the controller already
// fetched it); it supplies both the history to append to and the "before"
// side of the count transition.
export const softDeleteRole = async (id, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const role = await prisma.role.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      is_active: false,
      history: updatedHistory,
    },
    include: {
      department: departmentSelect,
      branch: branchSelect,
    },
  });

  // The row leaves the counted set: total -1, active -1 if it was active.
  recordRoleTransition(existing, role);
  return shapeRole(role);
};
