import prisma from "../../../prisma/client.js";

export const getRoleById = (id) => {
    return prisma.role.findUnique({ where: { id } });
};
