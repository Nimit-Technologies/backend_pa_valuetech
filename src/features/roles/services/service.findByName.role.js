import prisma from "../../../prisma/client.js";

export const findRoleByName = (name, department_id) => {
  return prisma.role.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      department_id,
    },
  });
};
