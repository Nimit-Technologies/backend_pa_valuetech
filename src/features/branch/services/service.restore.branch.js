import prisma from "../../../prisma/client.js";

export const restoreBranch = (id) => {
    return prisma.branch.update({
        where: { id },
        data: { deleted_at: null, is_active: true },
    });
};
