import prisma from "../../../prisma/client.js";

export const getBusinessTypeById = (id) => {
  return prisma.businessType.findUnique({
    where: { id },
  });
};
