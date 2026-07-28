import prisma from "../../../prisma/client.js";
import { departmentSelect, shapeRole } from "./role.service.helpers.js";

export const updateRole = async (id, data) => {
  const role = await prisma.role.update({
    where: { id },
    data,
    include: { department: departmentSelect },
  });

  return shapeRole(role);
};
