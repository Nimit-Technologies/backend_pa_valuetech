import { findRoleByName } from "../services/service.findByName.role.js";
import { createRole as createRoleService } from "../services/service.create.role.js";
import { roleSchema } from "../role.schema.js";

export const createRole = async (req, res) => {
    try {
        const parsed = roleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.issues });
        }

        const { name, branch_id } = parsed.data;

        const existing = await findRoleByName(name, branch_id);
        if (existing) {
            return res.status(409).json({ success: false, message: "Role already exists in this branch" });
        }

        const role = await createRoleService(name, branch_id);
        res.status(201).json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create role" });
    }
};
