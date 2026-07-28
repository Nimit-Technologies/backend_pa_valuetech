import { getRoleById } from "../services/service.getById.role.js";
import { findRoleByName } from "../services/service.findByName.role.js";
import { updateRole as updateRoleService } from "../services/service.update.role.js";
import { updateRoleSchema } from "../role.schema.js";

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }

    const existing = await getRoleById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({ success: false, message: "Role is soft-deleted; restore it before updating" });
    }

    const { name } = parsed.data;

    if (name) {
      const duplicate = await findRoleByName(name, existing.department_id);
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({ success: false, message: "Role with this name already exists in this department" });
      }
    }

    const noNameChange = name === undefined || name === existing.name;
    if (noNameChange) {
      return res.json({ success: true, message: "No changes are found" });
    }

    const role = await updateRoleService(id, parsed.data);
    res.json({ success: true, data: role });
  } catch (error) {
    console.error("updateRole error:", error);
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
};
