import prisma from "../../../prisma/client.js";

export const updateUser = (id, data) => {
  return prisma.user.update({ where: { id }, data });
};
