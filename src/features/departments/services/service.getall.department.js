import prisma from "../../../prisma/client.js";

export const getAllDepartments = () => {
  return prisma.department.findMany({
    orderBy: { created_at: "asc" },
    include: {
      branch: { select: { id: true, name: true } },
    },
  });
};
