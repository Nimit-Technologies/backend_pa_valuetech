import prisma from "../../../prisma/client.js";

// Bank names are unique per branch, not globally: the same bank name may be
// added under two different branches, so the duplicate check is scoped to
// branch_id.
export const findBankByName = (name, branch_id) => {
  return prisma.bank.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      branch_id,
    },
  });
};
