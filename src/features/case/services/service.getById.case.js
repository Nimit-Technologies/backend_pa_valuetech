import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";

// branch_id is optional: pass it to let the DB itself reject a case that
// exists but is outside the caller's branch, instead of fetching it and
// checking after.
export const getCaseById = async (id, branch_id) => {
  const caseRecord = await prisma.case.findFirst({
    where: {
      id,
      ...(branch_id && { branch_id }),
    },
    include: caseInclude,
  });

  return shapeCase(caseRecord);
};
