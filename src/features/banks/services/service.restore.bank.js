import prisma from "../../../prisma/client.js";
import { branchSelect } from "./bank.service.helpers.js";
import { recordBankTransition } from "../utils/bank-count.js";

export const restoreBank = async (id, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const bank = await prisma.bank.update({
    where: { id },
    data: {
      deleted_at: null,
      is_active: true,
      history: updatedHistory,
    },
    include: {
      branch: branchSelect,
      address: true,
    },
  });

  // The row re-enters the counted set as active: total +1, active +1.
  recordBankTransition(existing, bank);
  return bank;
};
