import prisma from "../../../prisma/client.js";

export const deleteBusinessType = (id) => {
    return prisma.businessType.delete({ where: { id } });
};
