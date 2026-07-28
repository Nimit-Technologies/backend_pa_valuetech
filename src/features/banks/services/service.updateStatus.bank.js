import prisma from "../../../prisma/client.js";

export const setBankStatus = (id, is_active) => {
  return prisma.bank.update({ where: { id }, data: { is_active } });
};
