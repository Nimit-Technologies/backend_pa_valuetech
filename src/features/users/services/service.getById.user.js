import prisma from "../../../prisma/client.js";

const relationSelect = { select: { id: true, name: true } };

// branch_id is optional: pass it to let the DB itself reject a user that
// exists but is outside the caller's branch, instead of fetching it and
// checking after.
export const getUserById = (id, branch_id) => {
  return prisma.user.findFirst({
    where: {
      id,
      ...(branch_id && { branch_id }),
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
      history: true,
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
