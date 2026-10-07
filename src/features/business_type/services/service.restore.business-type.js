import prisma from "../../../prisma/client.js";
import { branchSelect } from "./business-type.service.helpers.js";

export const restoreBusinessType = (id) => {
  return prisma.businessType.update({
    where: { id },
    data: { deleted_at: null, is_active: true },
    include: { branch: branchSelect },
  });
};
