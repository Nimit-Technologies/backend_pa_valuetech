import prisma from "../../../prisma/client.js";

export const getAllBanks = () => {
  return prisma.bank.findMany({
    orderBy: { created_at: "asc" },
    include: {
      branch: { select: { id: true, name: true } },
      address: true,
    },
  });
};
