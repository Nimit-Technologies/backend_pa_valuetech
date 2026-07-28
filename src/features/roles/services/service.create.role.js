import prisma from "../../../prisma/client.js";
import { departmentSelect, shapeRole } from "./role.service.helpers.js";

export const createRole = async (name, department_id) => {
  const role = await prisma.role.create({
    data: { name, department_id },
    include: { department: departmentSelect },
  });

  return shapeRole(role);
};
