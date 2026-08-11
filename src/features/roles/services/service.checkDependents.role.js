import prisma from "../../../prisma/client.js";

export const getRoleDependents = async (roleId) => {
  const users = await prisma.user.findMany({
    where: { role_id: roleId, deleted_at: null },
    select: { id: true, first_name: true, last_name: true },
  });

  return { users };
};
