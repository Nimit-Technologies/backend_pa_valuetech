import prisma from "../../../prisma/client.js";

export const deleteAddress = (id) => {
    return prisma.address.delete({ where: { id } });
};
