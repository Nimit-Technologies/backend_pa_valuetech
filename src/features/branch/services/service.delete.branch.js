import prisma from "../../../prisma/client.js";
import { recordBranchTransition } from "../utils/branch-count.js";

export const deleteBranch = async (id) => {
  // Prisma returns the row as it was, which is the "before" side of the
  // transition. A row that was already soft-deleted was not counted, so
  // hard-deleting it moves nothing.
  const branch = await prisma.branch.delete({ where: { id } });

  recordBranchTransition(branch, null);
  return branch;
};
