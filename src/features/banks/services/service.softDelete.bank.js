import prisma from "../../../prisma/client.js";

export const softDeleteBank = (id) => {
  return prisma.bank.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
  });
};
