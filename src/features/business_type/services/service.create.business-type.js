import prisma from "../../../prisma/client.js";
import { branchSelect } from "./business-type.service.helpers.js";

export const createBusinessType = (data) => {
  const { name, branch_id } = data;

  return prisma.businessType.create({
    data: {
      name,
      branch: { connect: { id: branch_id } },
    },
    include: { branch: branchSelect },
  });
};
