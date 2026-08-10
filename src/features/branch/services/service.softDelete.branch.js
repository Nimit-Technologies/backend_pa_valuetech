import prisma from "../../../prisma/client.js";

export const softDeleteBranch = (id) => {
  return prisma.branch.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
  });
};
