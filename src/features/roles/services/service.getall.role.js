import prisma from "../../../prisma/client.js";
import { departmentSelect, shapeRole } from "./role.service.helpers.js";

export const getAllRoles = async () => {
  const roles = await prisma.role.findMany({
    orderBy: { created_at: "asc" },
    include: { department: departmentSelect },
  });

  return roles.map(shapeRole);
};
