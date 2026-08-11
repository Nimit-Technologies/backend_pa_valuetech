import prisma from "../../../prisma/client.js";

export const softDeleteDepartment = (id) => {
  return prisma.department.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
  });
};
