import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";
import { recordDepartmentTransition } from "../utils/department-count.js";

export const createDepartment = async (name, branch_id, historyEntry) => {
  const department = await prisma.department.create({
    data: {
      name,
      branch_id,
      history: historyEntry ? [historyEntry] : [],
    },
    include: { branch: branchSelect },
  });

  recordDepartmentTransition(null, department);
  return department;
};
