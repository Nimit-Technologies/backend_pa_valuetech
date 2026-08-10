import prisma from "../../../prisma/client.js";

const relationSelect = { select: { id: true, name: true } };
const userSelect     = { select: { id: true, first_name: true, last_name: true, employee_id: true } };

export const getAllRemarks = ({ take = 20, cursor, case_id } = {}) => {
  return prisma.remark.findMany({
    where: { ...(case_id && { case_id }) },
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    take,
    include: {
      user:       userSelect,
      branch:     relationSelect,
      department: relationSelect,
      role:       relationSelect,
    },
    orderBy: { created_at: "desc" },
  });
};
