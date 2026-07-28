import prisma from "../../../prisma/client.js";

export const findBankByName = (name) => {
  return prisma.bank.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
};
