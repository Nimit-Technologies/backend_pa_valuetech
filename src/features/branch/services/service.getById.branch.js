import prisma from "../../../prisma/client.js";

export const getBranchById = (id) => {
  return prisma.branch.findFirst({ where: { id } });
};
