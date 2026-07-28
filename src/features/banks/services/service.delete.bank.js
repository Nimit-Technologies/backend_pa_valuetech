import prisma from "../../../prisma/client.js";

export const deleteBank = (id) => {
  return prisma.bank.delete({ where: { id } });
};
