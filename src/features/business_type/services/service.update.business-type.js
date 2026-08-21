import prisma from "../../../prisma/client.js";

export const updateBusinessType = (id, data) => {
  return prisma.businessType.update({ where: { id }, data });
};
