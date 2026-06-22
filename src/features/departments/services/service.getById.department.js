import prisma from "../../../prisma/client.js";

export const getDepartmentById = (id) => {
    return prisma.department.findUnique({ where: { id } });
};
