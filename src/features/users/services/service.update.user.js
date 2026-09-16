import prisma from "../../../prisma/client.js";
import { recordUserTransition } from "../utils/user-count.js";

const relationSelect = { select: { id: true, name: true } };

export const updateUser = async (id, data, historyEntry, existing) => {
  const { branch_id, department_id, role_id, address, ...rest } = data;
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
      ...(address && { address: { update: address } }),
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

  // `data` may flip is_active; the transition works that out from the rows.
  recordUserTransition(existing, user);
  return user;
};
