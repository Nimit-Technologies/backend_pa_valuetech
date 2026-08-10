import prisma from "../../../prisma/client.js";

export const deleteStatus = (id) => {
    return prisma.status.delete({ where: { id } });
};
