import prisma from "../../../prisma/client.js";

export const updateAddress = (id, data) => {
    return prisma.address.update({ where: { id }, data });
};
