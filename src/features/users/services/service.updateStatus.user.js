import prisma from "../../../prisma/client.js";

const relationSelect = { select: { id: true, name: true } };

export const setUserStatus = (id, is_active) => {
  return prisma.user.update({
    where: { id },
    // Deactivation is already caught live by isAuthenticated's is_active
    // check, but bump token_version here too so re-activation doesn't let a
    // token issued before the deactivation quietly start working again.
    data: { is_active, token_version: { increment: 1 } },
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
