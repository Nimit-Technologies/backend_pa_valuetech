import prisma from "../../../prisma/client.js";
import { branchSelect } from "./bank.service.helpers.js";
import { recordBankTransition } from "../utils/bank-count.js";

// `existing` is the row as it was before this write (the controller already
// fetched it); it supplies both the history to append to and the "before"
// side of the count transition.
export const softDeleteBank = async (id, historyEntry, existing) => {
  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const bank = await prisma.bank.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      is_active: false,
      history: updatedHistory,
    },
    include: {
      branch: branchSelect,
      address: true,
    },
  });

  // The row leaves the counted set: total -1, active -1 if it was active.
  recordBankTransition(existing, bank);
  return bank;
};
