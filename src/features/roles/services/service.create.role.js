import prisma from "../../../prisma/client.js";

export const createRole = (name, branch_id) => {
    return prisma.role.create({ data: { name, branch_id } });
};
