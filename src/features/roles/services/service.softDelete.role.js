import prisma from "../../../prisma/client.js";
import { departmentSelect, shapeRole } from "./role.service.helpers.js";

export const softDeleteRole = async (id) => {
  const role = await prisma.role.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
    include: { department: departmentSelect },
  });

  return shapeRole(role);
};
