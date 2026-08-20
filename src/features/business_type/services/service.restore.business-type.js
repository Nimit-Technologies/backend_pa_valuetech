import prisma from "../../../prisma/client.js";

export const restoreBusinessType = (id) => {
  return prisma.businessType.update({
    where: { id },
    data: { deleted_at: null, is_active: true },
  });
};
