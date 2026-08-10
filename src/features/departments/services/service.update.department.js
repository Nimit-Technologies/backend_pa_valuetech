import prisma from "../../../prisma/client.js";

export const updateDepartment = (id, data) => {
  return prisma.department.update({ where: { id }, data });
};
