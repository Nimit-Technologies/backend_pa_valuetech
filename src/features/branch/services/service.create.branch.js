import prisma from "../../../prisma/client.js";

export const createBranch = (name) => {
    return prisma.branch.create({ data: { name } });
};
