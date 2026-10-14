import prisma from "../../../prisma/client.js";
import { statusSelect } from "./status.service.helpers.js";

// Soft delete also clears is_active, so a status cannot sit in the
// deleted-but-active state. restoreStatus sets both back together.
export const softDeleteStatus = (id) => {
  return prisma.status.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
    select: statusSelect,
  });
};
