import prisma from "../../../prisma/client.js";

export const getAllAddresses = () => {
  return prisma.address.findMany({ orderBy: { created_at: "asc" } });
};
