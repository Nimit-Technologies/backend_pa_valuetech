import * as roleService from "./roles.service.js";
import { roleSchema } from "./role.schema.js";



export const getAllRoles = async (req, res) => {
    try {
        const roles = await roleService.getAllRoles();
        res.json({ success: true, data: roles });
    } catch (error) {
        console.error("getAllRoles error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch roles" });
    }
};

export const getRoleById = async (req, res) => {
    try {
        const id = req.params.id;
        const role = await roleService.getRoleById(id);

        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        res.json({ success: true, data: role });
    } catch (error) {
        console.error("getRoleById error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch role" });
    }
};

export const createRole = async (req, res) => {
    try {
        const parsed = roleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.issues });
        }

        const { name } = parsed.data;

        const existing = await roleService.findRoleByName(name);
        if (existing) {
            return res.status(409).json({ success: false, message: "Role already exists" });
        }

        const role = await roleService.createRole(name);
        res.status(201).json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create role" });
    }
};

export const updateRole = async (req, res) => {
    try {
        const id = req.params.id;

        const parsed = roleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.issues });
        }

        const { name } = parsed.data;

        const existing = await roleService.getRoleById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        const role = await roleService.updateRole(id, name);
        res.json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update role" });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Deleting role with ID: ${id}`); 

        const existing = await roleService.getRoleById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        await roleService.deleteRole(id);
        res.json({ success: true, message: "Role deleted successfully" });
    } catch (error) {
        console.error("deleteRole error:", error);
        res.status(500).json({ success: false, message: "Failed to delete role" });
    }
};
