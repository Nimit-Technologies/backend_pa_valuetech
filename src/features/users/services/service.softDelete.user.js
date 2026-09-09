import prisma from "../../../prisma/client.js";

const relationSelect = { select: { id: true, name: true } };

export const softDeleteUser = (id, historyEntry, existingHistory = []) => {
  const currentHistory = Array.isArray(existingHistory) ? existingHistory : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  return prisma.user.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      is_active: false,
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
};
