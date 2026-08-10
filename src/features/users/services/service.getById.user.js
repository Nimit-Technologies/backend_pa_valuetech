import prisma from "../../../prisma/client.js";

const relationSelect = { select: { id: true, name: true } };

export const getUserById = (id) => {
  return prisma.user.findUnique({
    where: { id },
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
      deleted_at: true,
    },
  });
};
