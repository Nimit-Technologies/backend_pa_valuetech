import prisma from "../../../prisma/client.js";

export const findDepartmentByName = (name, branch_id) => {
    return prisma.department.findFirst({
        where: {
            name: { equals: name, mode: "insensitive" },
            branch_id,
        },
    });
};
