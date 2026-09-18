import prisma from "../../../prisma/client.js";
import { recordUserTransition } from "../utils/user-count.js";

const relationSelect = { select: { id: true, name: true } };

export const restoreUser = async (id, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const user = await prisma.user.update({
    where: { id },
    data: {
      deleted_at: null,
      is_active: true,
      history: updatedHistory,
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

  // The row re-enters the counted set as active: total +1, active +1.
  recordUserTransition(existing, user);
  return user;
};
