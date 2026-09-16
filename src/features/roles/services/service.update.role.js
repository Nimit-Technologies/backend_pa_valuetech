import prisma from "../../../prisma/client.js";
import {
  departmentSelect,
  branchSelect,
  shapeRole,
} from "./role.service.helpers.js";
import { recordRoleTransition } from "../utils/role-count.js";

export const updateRole = async (id, data, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
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

  // `data` may flip is_active; the transition works that out from the rows.
  recordRoleTransition(existing, role);
  return shapeRole(role);
};
