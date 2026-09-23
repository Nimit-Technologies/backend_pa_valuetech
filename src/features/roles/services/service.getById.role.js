import prisma from "../../../prisma/client.js";
import {
  departmentSelect,
  branchSelect,
  shapeRole,
} from "./role.service.helpers.js";

// branch_id is optional: pass it to let the DB itself reject a role that
// exists but is outside the caller's branch, instead of fetching it and
// checking after.
export const getRoleById = async (id, branch_id) => {
  const role = await prisma.role.findFirst({
    where: {
      id,
      ...(branch_id && { branch_id }),
    },
    include: {
      department: departmentSelect,
      branch: branchSelect,
    },
  });

  return shapeRole(role);
};
