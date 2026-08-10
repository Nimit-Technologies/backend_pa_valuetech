import prisma from "../../../prisma/client.js";

export const getAllStatuses = () => {
    return prisma.status.findMany({
        orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });
};
