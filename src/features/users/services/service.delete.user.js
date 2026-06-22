import prisma from "../../../prisma/client.js";

export const deleteUser = (id) => {
  return prisma.user.delete({ where: { id } });
};
