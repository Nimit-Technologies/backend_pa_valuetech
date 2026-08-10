import prisma from "../../../prisma/client.js";


export const deleteAllRemarks = () => {
  return prisma.remark.deleteMany({
    where: {},
  });
};
