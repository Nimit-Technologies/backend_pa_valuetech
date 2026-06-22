import prisma from "../../../prisma/client.js";

export const findRoleByName = (name, branch_id) => {
    return prisma.role.findFirst({
        where: {
            name: { equals: name, mode: "insensitive" },
            branch_id,
        },
    });
};
