import prisma from "../../../prisma/client.js";
import { branchSelect } from "./business-type.service.helpers.js";

export const softDeleteBusinessType = (id) => {
  return prisma.businessType.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
    include: { branch: branchSelect },
  });
};
