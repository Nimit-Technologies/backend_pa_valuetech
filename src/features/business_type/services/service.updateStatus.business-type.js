import prisma from "../../../prisma/client.js";

export const setBusinessTypeStatus = (id, is_active) => {
  return prisma.businessType.update({
    where: { id },
    data: { is_active },
    select: {
      id: true,
      name: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });
};
