import prisma from "../../../prisma/client.js";

export const createBranch = (name, historyEntry) => {
  return prisma.branch.create({
    data: {
      name,
      history: historyEntry ? [historyEntry] : [],
    },
  });
};
