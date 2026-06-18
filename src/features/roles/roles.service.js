import { randomUUID } from "crypto";
import prisma from "../../prisma/client.js";

export const getAllRoles = () => {
    return prisma.role.findMany({ orderBy: { id: "asc" } });
};

export const getRoleById = (id) => {
    return prisma.role.findUnique({ where: { id } });
};

export const findRoleByName = (name) => {
    return prisma.role.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
};

export const createRole = (name) => {
    return prisma.role.create({ data: { id: `role-${randomUUID()}`, name } });
};

export const updateRole = (id, name) => {
    return prisma.role.update({ where: { id }, data: { name } });
};

export const deleteRole = (id) => {
    return prisma.role.delete({ where: { id } });
};
