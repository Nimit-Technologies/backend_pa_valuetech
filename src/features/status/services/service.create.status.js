import prisma from "../../../prisma/client.js";

export const createStatus = (data) => {
  const { name, sort_order } = data;

  return prisma.status.create({
    data: { name, sort_order },
  });
};
