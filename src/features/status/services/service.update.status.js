import prisma from "../../../prisma/client.js";

export const updateStatus = (id, data) => {
    return prisma.status.update({ where: { id }, data });
};
