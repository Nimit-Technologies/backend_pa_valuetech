import * as departmentService from "./departments.service.js";
import { departmentSchema } from "./department.schema.js";

export const getAllDepartments = async (req, res) => {
    try {
        const departments = await departmentService.getAllDepartments();
        res.json({ success: true, data: departments });
    } catch (error) {
        console.error("getAllDepartments error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch departments" });
    }
};

export const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await departmentService.getDepartmentById(id);

        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        res.json({ success: true, data: department });
    } catch (error) {
        console.error("getDepartmentById error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch department" });
    }
};

export const createDepartment = async (req, res) => {
    try {
        const parsed = departmentSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.issues });
        }

        const { name } = parsed.data;

        const existing = await departmentService.findDepartmentByName(name);
        if (existing) {
            return res.status(409).json({ success: false, message: "Department already exists" });
        }

        const department = await departmentService.createDepartment(name);
        res.status(201).json({ success: true, data: department });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create department" });
    }
};

export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const parsed = departmentSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.issues });
        }

        const { name } = parsed.data;

        const existing = await departmentService.getDepartmentById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        const department = await departmentService.updateDepartment(id, name);
        res.json({ success: true, data: department });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update department" });
    }
};

export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await departmentService.getDepartmentById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        await departmentService.deleteDepartment(id);
        res.json({ success: true, message: "Department deleted successfully" });
    } catch (error) {
        console.error("deleteDepartment error:", error);
        res.status(500).json({ success: false, message: "Failed to delete department" });
    }
};
