import prisma from "../../../prisma/client.js";
import { departmentSelect, shapeRole } from "./role.service.helpers.js";

export const setRoleStatus = async (id, is_active) => {
  const role = await prisma.role.update({
    where: { id },
    data: { is_active },
    include: { department: departmentSelect },
  });

  return shapeRole(role);
};
