import prisma from "../../../prisma/client.js";

export const getUserByEmployeeId = (employee_id) => {
    return prisma.user.findFirst({ where: { employee_id } });
};
