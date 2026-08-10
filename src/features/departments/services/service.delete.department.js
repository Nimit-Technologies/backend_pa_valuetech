import prisma from "../../../prisma/client.js";

export const deleteDepartment = (id) => {
  return prisma.department.delete({ where: { id } });
};
