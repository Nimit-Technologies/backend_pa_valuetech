import prisma from "../../../prisma/client.js";
import { recordBranchTransition } from "../utils/branch-count.js";

export const createBranch = async (name, is_active, historyEntry) => {
  const branch = await prisma.branch.create({
    data: {
      name,
      is_active,
      history: historyEntry ? [historyEntry] : [],
    },
  });

  recordBranchTransition(null, branch);
  return branch;
};
