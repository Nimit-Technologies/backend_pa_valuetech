import prisma from "../../../prisma/client.js";

export const getUserById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, employee_id: true, first_name: true, last_name: true,
      email: true, phone: true, adhar_number: true, is_active: true,
      branch: true, department: true, role: true, address: true,
      created_at: true, updated_at: true,
    },
  });
};
