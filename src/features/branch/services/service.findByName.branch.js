import prisma from "../../../prisma/client.js";

export const findBranchByName = (name) => {
  return prisma.branch.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
};
