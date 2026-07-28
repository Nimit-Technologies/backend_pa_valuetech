import prisma from "../../../prisma/client.js";

export const setBranchStatus = (id, is_active) => {
    return prisma.branch.update({ where: { id }, data: { is_active } });
};
