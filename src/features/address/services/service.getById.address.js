import prisma from "../../../prisma/client.js";

export const getAddressById = (id) => {
  return prisma.address.findUnique({ where: { id } });
};
