import prisma from "../../../prisma/client.js";

// A bank's own branch code is unique per branch, not globally: the same
// code may be reused under a different branch.
export const findBankByBranchCode = (bank_branch_code, branch_id) => {
  return prisma.bank.findFirst({
    where: {
      bank_branch_code: { equals: bank_branch_code, mode: "insensitive" },
      branch_id,
    },
  });
};
