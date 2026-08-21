import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";

export const createDepartment = (name, branch_id) => {
  return prisma.department.create({
    data: { name, branch_id },
    include: { branch: branchSelect },
  });
};
