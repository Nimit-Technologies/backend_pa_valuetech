import prisma from "../../../prisma/client.js";
import { branchSelect } from "./bank.service.helpers.js";
import { recordBankTransition } from "../utils/bank-count.js";

export const updateBank = async (id, data, historyEntry, existing) => {
  const { branch_id, address, ...rest } = data;

  const currentHistory = Array.isArray(existing?.history)
    ? existing.history
    : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  const bank = await prisma.bank.update({
    where: { id },
    data: {
      ...rest,
      ...(branch_id && { branch: { connect: { id: branch_id } } }),
      ...(address && { address: { update: address } }),
      history: updatedHistory,
    },
    include: {
      branch: branchSelect,
      address: true,
    },
  });

  // `data` may flip is_active; the transition works that out from the rows.
  recordBankTransition(existing, bank);
  return bank;
};
