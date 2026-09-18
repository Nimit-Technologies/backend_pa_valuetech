import prisma from "../../../prisma/client.js";

export const findUserForLogin = (employee_id) => {
  // employee_id is @unique in the schema, so findUnique (point lookup on the
  // unique index) is both more precise and cheaper than findFirst (which
  // Prisma/Postgres treat as a general filtered query).
  return prisma.user.findUnique({
    where: { employee_id },

    omit: { password: false },

    include: {
      role: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });
};
