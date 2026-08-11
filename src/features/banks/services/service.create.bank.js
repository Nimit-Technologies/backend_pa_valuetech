import prisma from "../../../prisma/client.js";

const branchSelect = { select: { id: true, name: true } };

export const createBank = (data) => {
  const { name, display_name, gst_number, branch_code, branch_id, address } =
    data;

  return prisma.bank.create({
    data: {
      name,
      display_name,
      gst_number,
      branch_code,
      branch: { connect: { id: branch_id } },
      address: { create: address },
    },
    include: {
      branch: branchSelect,
      address: true,
    },
  });
};
