import prisma from "../../../prisma/client.js";
import {
  departmentSelect,
  branchSelect,
  shapeRole,
} from "./role.service.helpers.js";
import { recordRoleTransition } from "../utils/role-count.js";

export const restoreRole = async (id, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const role = await prisma.role.update({
    where: { id },
    data: {
      deleted_at: null,
      is_active: true,
      history: updatedHistory,
    },
    include: {
      department: departmentSelect,
      branch: branchSelect,
    },
  });

  // The row re-enters the counted set as active: total +1, active +1.
  recordRoleTransition(existing, role);
  return shapeRole(role);
};
