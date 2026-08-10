import prisma from "../../../prisma/client.js";

export const restoreDepartment = (id) => {
  return prisma.department.update({
    where: { id },
    data: { deleted_at: null, is_active: true },
  });
};
