import prisma from "../../../prisma/client.js";

export const findBusinessTypeByName = (name) => {
  return prisma.businessType.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
    },
  });
};
