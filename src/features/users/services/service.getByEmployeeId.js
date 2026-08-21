import prisma from "../../../prisma/client.js";

export const getUserByEmployeeId = (employee_id, excludeId) => {
  return prisma.user.findFirst({
    where: {
      employee_id: { equals: employee_id, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
};
