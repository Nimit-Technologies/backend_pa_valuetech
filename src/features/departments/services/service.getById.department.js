import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";

// branch_id is optional: pass it to let the DB itself reject a department
// that exists but is outside the caller's branch, instead of fetching it
// and checking after.
export const getDepartmentById = (id, branch_id) => {
  return prisma.department.findFirst({
    where: {
      id,
      ...(branch_id && { branch_id }),
    },
    include: { branch: branchSelect },
  });
};
