import prisma from "../../../prisma/client.js";

export const getStatusById = (id) => {
  return prisma.status.findUnique({
    where: { id },
  });
};
