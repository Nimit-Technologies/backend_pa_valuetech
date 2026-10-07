import prisma from "../../../prisma/client.js";
import { branchSelect } from "./business-type.service.helpers.js";

export const setBusinessTypeStatus = (id, is_active) => {
  return prisma.businessType.update({
    where: { id },
    data: { is_active },
    select: {
      id: true,
      name: true,
      is_active: true,
      branch_id: true,
      branch: branchSelect,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });
};
