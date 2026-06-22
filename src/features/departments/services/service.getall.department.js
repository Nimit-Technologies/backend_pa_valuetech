import prisma from "../../../prisma/client.js";

export const getAllDepartments = () => {
    return prisma.department.findMany({ orderBy: { created_at: "asc" } });
};
