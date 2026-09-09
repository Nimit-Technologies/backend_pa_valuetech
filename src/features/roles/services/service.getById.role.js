import prisma from "../../../prisma/client.js";
import {
  departmentSelect,
  branchSelect,
  shapeRole,
} from "./role.service.helpers.js";

export const getRoleById = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      department: departmentSelect,
      branch: branchSelect,
    },
  });

  return shapeRole(role);
};
