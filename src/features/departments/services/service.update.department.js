import prisma from "../../../prisma/client.js";

export const updateDepartment = (id, name) => {
    return prisma.department.update({ where: { id }, data: { name } });
};
