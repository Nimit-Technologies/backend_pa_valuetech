import prisma from "../../../prisma/client.js";

// Business type names are unique per branch, not globally: the same name may
// be added under two different branches, so the duplicate check is scoped to
// branch_id.
export const findBusinessTypeByName = (name, branch_id) => {
  return prisma.businessType.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      branch_id,
      deleted_at: null,
    },
  });
};
