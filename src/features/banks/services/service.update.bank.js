import prisma from "../../../prisma/client.js";

const branchSelect = { select: { id: true, name: true } };

export const updateBank = (id, data) => {
  const { branch_id, address, ...rest } = data;

  return prisma.bank.update({
    where: { id },
    data: {
      ...rest,
      ...(branch_id && { branch: { connect: { id: branch_id } } }),
      ...(address && { address: { update: address } }),
    },
    include: {
      branch: branchSelect,
      address: true,
    },
  });
};
