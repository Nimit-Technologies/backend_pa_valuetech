import prisma from "../../../prisma/client.js";

export const restoreRole = (id) => {
    return prisma.role.update({
      where: { id },
      data: { deleted_at: null, is_active: true },
    });
};
