import prisma from "../../../prisma/client.js";
import { statusSelect } from "./status.service.helpers.js";

// The mirror of softDeleteStatus: the row comes back active, since that is the
// state it was forced out of on soft delete.
export const restoreStatus = (id) => {
  return prisma.status.update({
    where: { id },
    data: { deleted_at: null, is_active: true },
    select: statusSelect,
  });
};
