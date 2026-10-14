import prisma from "../../../prisma/client.js";
import { remarkInclude, shapeRemark } from "./remark.service.helpers.js";

// Remarks are always read for one case. The case id is required, not an
// optional filter: without it this returned every remark in the database to any
// authenticated caller.
//
// `branchId` scopes through the *case's* branch rather than Remark.branch_id —
// that column is a snapshot of the author's branch at the time of writing,
// which is a different thing and drifts if the author later moves.
export const getRemarksForCase = async ({
  caseId,
  branchId,
  take = 20,
  cursor,
}) => {
  const remarks = await prisma.remark.findMany({
    where: {
      case_id: caseId,
      ...(branchId && { case: { branch_id: branchId } }),
    },
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    take,
    include: remarkInclude,
    orderBy: { created_at: "desc" },
  });

  return remarks.map(shapeRemark);
};
