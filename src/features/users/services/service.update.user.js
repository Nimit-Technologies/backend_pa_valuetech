import prisma from "../../../prisma/client.js";
import { recordUserTransition } from "../utils/user-count.js";

const relationSelect = { select: { id: true, name: true } };

export const updateUser = async (id, data, historyEntry, existing) => {
  const {
    branch_id,
    department_id,
    role_id,
    business_type_id,
    address,
    ...rest
  } = data;
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      history: updatedHistory,
      ...(branch_id && { branch: { connect: { id: branch_id } } }),
      ...(department_id && { department: { connect: { id: department_id } } }),
      ...(role_id && { role: { connect: { id: role_id } } }),
      // Explicit null moves a user off their business line; undefined leaves it
      // untouched, so the two cases cannot be collapsed into one truthy check.
      ...(business_type_id !== undefined && {
        business_type:
          business_type_id === null
            ? { disconnect: true }
            : { connect: { id: business_type_id } },
      }),
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
      history: true,
      branch: relationSelect,
      department: relationSelect,
      role: relationSelect,
      business_type: relationSelect,
      address: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  // `data` may flip is_active; the transition works that out from the rows.
  recordUserTransition(existing, user);
  return user;
};
