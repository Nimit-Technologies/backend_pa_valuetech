import prisma from "../../../prisma/client.js";
import {
  departmentSelect,
  branchSelect,
  shapeRole,
} from "./role.service.helpers.js";

export const createRole = async (
  name,
  department_id,
  branch_id,
  historyEntry,
) => {
  const role = await prisma.role.create({
    data: {
      name,
      department_id,
      branch_id,
      history: historyEntry ? [historyEntry] : [],
    },
    include: {
      department: departmentSelect,
      branch: branchSelect,
    },
  });

  return shapeRole(role);
};
