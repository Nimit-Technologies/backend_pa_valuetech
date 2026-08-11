import prisma from "../../../prisma/client.js";
export const deleteBranch = (id) => {
  return prisma.branch.delete({ where: { id } });
};
