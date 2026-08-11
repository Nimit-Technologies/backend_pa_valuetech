import prisma from "../../../prisma/client.js";

const relationSelect = { select: { id: true, name: true } };

export const getAllUsers = ({ take = 20, cursor } = {}) => {
  return prisma.user.findMany({
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    take,
    omit: {
      user: {
        password: true,
      },
    },
    select: {
      id: true,
      employee_id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      aadhaar_number: true,
      is_active: true,
      branch: relationSelect,
      department: relationSelect,
      role: relationSelect,
      address: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "desc" },
  });
};
