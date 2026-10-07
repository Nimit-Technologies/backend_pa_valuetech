import prisma from "../../../prisma/client.js";
import { branchSelect } from "./business-type.service.helpers.js";

export const updateBusinessType = (id, data) => {
  const { branch_id, ...rest } = data;

  return prisma.businessType.update({
    where: { id },
    data: {
      ...rest,
      ...(branch_id && { branch: { connect: { id: branch_id } } }),
    },
    include: { branch: branchSelect },
  });
};
