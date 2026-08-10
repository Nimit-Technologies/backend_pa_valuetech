import prisma from "../../../prisma/client.js";

export const getBranchDependents = async (branchId) => {
  // Soft-deleted rows still physically exist and still block a hard delete
  // via the onDelete: Restrict FK, so they must not be filtered out here.
  const [departments, users, banks, roles] = await Promise.all([
    prisma.department.findMany({
      where: { branch_id: branchId },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { branch_id: branchId },
      select: { id: true, first_name: true, last_name: true },
    }),
    prisma.bank.findMany({
      where: { branch_id: branchId },
      select: { id: true, name: true },
    }),
    prisma.role.findMany({
      where: { department: { branch_id: branchId } },
      select: { id: true, name: true },
    }),
  ]);

  return { departments, users, banks, roles };
};
