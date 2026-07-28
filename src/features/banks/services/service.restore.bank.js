import prisma from "../../../prisma/client.js";

export const restoreBank = (id) => {
  return prisma.bank.update({
    where: { id },
    data: { deleted_at: null, is_active: true },
  });
};
