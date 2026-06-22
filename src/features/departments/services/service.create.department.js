import prisma from "../../../prisma/client.js";

export const createDepartment = (name, branch_id) => {
    return prisma.department.create({ data: { name, branch_id } });
};
