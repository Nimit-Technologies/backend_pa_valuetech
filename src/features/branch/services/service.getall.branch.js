import prisma from "../../../prisma/client.js";

export const getAllBranches = () => {
    return prisma.branch.findMany({ orderBy: { created_at: "asc" } });
};
