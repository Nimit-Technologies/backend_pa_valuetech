import prisma from "../../../prisma/client.js";

export const getBankById = (id) => {
  return prisma.bank.findUnique({
    where: { id },
    include: {
      branch: { select: { id: true, name: true } },
      address: true,
    },
  });
};
