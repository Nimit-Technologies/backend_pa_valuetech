import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";

export const getDepartmentById = (id) => {
  return prisma.department.findUnique({
    where: { id },
    include: { branch: branchSelect },
  });
};
