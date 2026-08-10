import prisma from "../../../prisma/client.js";

export const getDepartmentDependents = async (departmentId) => {
  // Soft-deleted rows still physically exist and still block a hard delete
  // via the onDelete: Restrict FK, so they must not be filtered out here.
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      where: { department_id: departmentId },
      select: { id: true, first_name: true, last_name: true },
    }),
    prisma.role.findMany({
      where: { department_id: departmentId },
      select: { id: true, name: true },
    }),
  ]);

  return { users, roles };
};
