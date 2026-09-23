import prisma from "../../../prisma/client.js";
import { branchSelect } from "./bank.service.helpers.js";
import { recordBankTransition } from "../utils/bank-count.js";

export const setBankStatus = async (id, is_active, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const bank = await prisma.bank.update({
    where: { id },
    data: {
      is_active,
      history: updatedHistory,
    },
    include: {
      branch: branchSelect,
      address: true,
    },
  });

  recordBankTransition(existing, bank);
  return bank;
};
