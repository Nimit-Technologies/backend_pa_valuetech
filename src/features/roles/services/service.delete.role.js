import prisma from "../../../prisma/client.js";

export const deleteRole = (id) => {
    return prisma.role.delete({ where: { id } });
};
