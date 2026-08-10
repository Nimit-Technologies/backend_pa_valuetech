import prisma from "../../../prisma/client.js";

export const getUserByEmployeeId = (employee_id) => {
  return prisma.user.findUnique({ where: { employee_id } });
};
