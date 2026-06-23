import prisma from "../../../prisma/client.js";

export const findUserForLogin = (employee_id) => {
  return prisma.user.findUnique({
    where: { employee_id },
    include: {
      role:       { select: { id: true, name: true } },
      branch:     { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });
};
