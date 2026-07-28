import prisma from "../../../prisma/client.js";

export const setDepartmentStatus = (id, is_active) => {
    return prisma.department.update({ where: { id }, data: { is_active } });
};
