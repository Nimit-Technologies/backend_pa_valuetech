import prisma from "../../../prisma/client.js";

export const softDeleteStatus = (id) => {
  return prisma.status.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
  });
};
