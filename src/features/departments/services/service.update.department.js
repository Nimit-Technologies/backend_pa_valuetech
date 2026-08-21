import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";

export const updateDepartment = (id, data) => {
  return prisma.department.update({
    where: { id },
    data,
    include: { branch: branchSelect },
  });
};
