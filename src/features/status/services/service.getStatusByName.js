import prisma from "../../../prisma/client.js";

export const findStatusByName = (name) => {
  return prisma.status.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
    },
  });
};
