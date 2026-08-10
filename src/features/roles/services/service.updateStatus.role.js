import prisma from "../../../prisma/client.js";

export const setRoleStatus = (id, is_active) => {
  return prisma.role.update({ where: { id }, data: { is_active } });
};
