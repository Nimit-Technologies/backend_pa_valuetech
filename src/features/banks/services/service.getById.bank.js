import prisma from "../../../prisma/client.js";

// branch_id is optional: pass it to let the DB itself reject a bank that
// exists but is outside the caller's branch, instead of fetching it and
// checking after. Omitting it (as every other caller of this shared
// service still does) keeps the old unscoped lookup.
export const getBankById = (id, branch_id) => {
  return prisma.bank.findFirst({
    where: {
      id,
      ...(branch_id && { branch_id }),
    },
    include: {
      branch: { select: { id: true, name: true } },
      address: true,
    },
  });
};
