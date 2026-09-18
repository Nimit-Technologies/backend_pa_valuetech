import prisma from "../../../prisma/client.js";
import { recordRoleTransition } from "../utils/role-count.js";

export const deleteRole = async (id) => {
  // Prisma returns the row as it was, which is the "before" side of the
  // transition. A row that was already soft-deleted was not counted, so
  // hard-deleting it moves nothing.
  const role = await prisma.role.delete({ where: { id } });

  recordRoleTransition(role, null);
  return role;
};
