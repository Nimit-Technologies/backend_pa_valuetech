import prisma from "../../../prisma/client.js";

export const createAddress = (data) => {
    return prisma.address.create({ data });
};
