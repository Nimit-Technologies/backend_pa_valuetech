import prisma from "../../../prisma/client.js";
import { recordUserTransition } from "../utils/user-count.js";

export const deleteUser = async (id) => {
  // Prisma returns the row as it was, which is the "before" side of the
  // transition. A row that was already soft-deleted was not counted, so
  // hard-deleting it moves nothing.
  const user = await prisma.user.delete({ where: { id } });

  recordUserTransition(user, null);
  return user;
};
