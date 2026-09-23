import prisma from "../../../prisma/client.js";
import { branchSelect } from "./bank.service.helpers.js";
import { recordBankTransition } from "../utils/bank-count.js";

export const createBank = async (data, historyEntry) => {
  const {
    name,
    display_name,
    bank_branch,
    bank_branch_code,
    gst_number,
    branch_id,
    address,
  } = data;

  const bank = await prisma.bank.create({
    data: {
      name,
      display_name,
      bank_branch,
      bank_branch_code,
      gst_number,
      branch: { connect: { id: branch_id } },
      address: { create: address },
      history: historyEntry ? [historyEntry] : [],
    },
    include: {
      branch: branchSelect,
      address: true,
    },
  });

  recordBankTransition(null, bank);
  return bank;
};
