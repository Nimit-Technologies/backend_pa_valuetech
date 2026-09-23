import prisma from "../../../prisma/client.js";
import { recordBankTransition } from "../utils/bank-count.js";

export const deleteBank = async (id) => {
  // Prisma returns the row as it was, which is the "before" side of the
  // transition. A row that was already soft-deleted was not counted, so
  // hard-deleting it moves nothing.
  const bank = await prisma.bank.delete({ where: { id } });

  recordBankTransition(bank, null);
  return bank;
};
