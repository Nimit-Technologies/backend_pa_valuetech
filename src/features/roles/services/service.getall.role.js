import prisma from "../../../prisma/client.js";

export const getAllRoles = () => {
    return prisma.role.findMany({ orderBy: { created_at: "asc" } });
};
