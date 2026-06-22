import prisma from "../../../prisma/client.js";

export const updateBranch = (id, name) => {
    return prisma.branch.update({ where: { id }, data: { name } });
};
