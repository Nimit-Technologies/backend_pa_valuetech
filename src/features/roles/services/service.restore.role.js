import prisma from "../../../prisma/client.js";
import { departmentSelect, shapeRole } from "./role.service.helpers.js";

export const restoreRole = async (id) => {
  const role = await prisma.role.update({
    where: { id },
    data: { deleted_at: null, is_active: true },
    include: { department: departmentSelect },
  });

  return shapeRole(role);
};
