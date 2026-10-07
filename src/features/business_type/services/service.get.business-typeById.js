import prisma from "../../../prisma/client.js";
import { branchSelect } from "./business-type.service.helpers.js";

// branch_id is optional: pass it to let the DB itself reject a business type
// that exists but is outside the caller's branch, instead of fetching it and
// checking after. Omitting it (as the case module's callers still do) keeps
// the old unscoped lookup.
export const getBusinessTypeById = (id, branch_id) => {
  return prisma.businessType.findFirst({
    where: {
      id,
      ...(branch_id && { branch_id }),
    },
    include: { branch: branchSelect },
  });
};
