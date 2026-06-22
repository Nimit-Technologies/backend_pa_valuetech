import prisma from "../../../prisma/client.js";

export const updateRole = (id, name) => {
    return prisma.role.update({ where: { id }, data: { name } });
};
