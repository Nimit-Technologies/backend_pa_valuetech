import prisma from "../../../prisma/client.js";

export const findBranchByName = (name, excludeId) => {
  return prisma.branch.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
};
