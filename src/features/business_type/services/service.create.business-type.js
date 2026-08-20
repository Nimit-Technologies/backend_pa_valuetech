import prisma from "../../../prisma/client.js";

export const createBusinessType = (data) => {
  const { name } = data;

  return prisma.businessType.create({
    data: {
      name,
    },
  });
};
