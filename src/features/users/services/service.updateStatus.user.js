import prisma from "../../../prisma/client.js";
import { recordUserTransition } from "../utils/user-count.js";

const relationSelect = { select: { id: true, name: true } };

export const setUserStatus = async (id, is_active, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const user = await prisma.user.update({
    where: { id },

    data: {
      is_active,
      history: updatedHistory,
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
      address: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  recordUserTransition(existing, user);
  return user;
};
