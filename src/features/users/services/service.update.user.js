import prisma from "../../../prisma/client.js";

const relationSelect = { select: { id: true, name: true } };

export const updateUser = (id, data) => {
  const { branch_id, department_id, role_id, address, ...rest } = data;

  return prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(branch_id && { branch: { connect: { id: branch_id } } }),
      ...(department_id && { department: { connect: { id: department_id } } }),
      ...(role_id && { role: { connect: { id: role_id } } }),
      ...(address && { address: { update: address } }),
      // Any field here (role/branch/department/status/password) can change
      // what an already-issued token is allowed to do — bump token_version
      // unconditionally so isAuthenticated rejects those tokens instead of
      // trusting stale claims for the rest of the TTL.
      token_version: { increment: 1 },
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
  });
};
