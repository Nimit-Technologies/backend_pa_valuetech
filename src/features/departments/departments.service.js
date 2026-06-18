import { randomUUID } from "crypto";
import prisma from "../../prisma/client.js";

export const getAllDepartments = () => {
    return prisma.department.findMany({ orderBy: { id: "asc" } });
};

export const getDepartmentById = (id) => {
    return prisma.department.findUnique({ where: { id } });
};

export const findDepartmentByName = (name) => {
    return prisma.department.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
};

export const createDepartment = (name) => {
    return prisma.department.create({ data: { id: `department-${randomUUID()}`, name } });
};

export const updateDepartment = (id, name) => {
    return prisma.department.update({ where: { id }, data: { name } });
};

export const deleteDepartment = (id) => {
    return prisma.department.delete({ where: { id } });
};
