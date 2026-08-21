import prisma from "../../../prisma/client.js";

export const softDeleteBusinessType = (id) => {
  return prisma.businessType.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
  });
};
