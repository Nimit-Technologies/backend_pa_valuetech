import prisma from "../../../prisma/client.js";
import {
  departmentSelect,
  branchSelect,
  shapeRole,
} from "./role.service.helpers.js";
import { recordRoleTransition } from "../utils/role-count.js";

export const setRoleStatus = async (id, is_active, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const role = await prisma.role.update({
    where: { id },
    data: {
      is_active,
      history: updatedHistory,
    },
    include: {
      department: departmentSelect,
      branch: branchSelect,
    },
  });

  recordRoleTransition(existing, role);
  return shapeRole(role);
};
