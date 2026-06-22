import { z } from "zod";
import { getRoleById }                   from "../services/service.getById.role.js";
import { findRoleByName }                from "../services/service.findByName.role.js";
import { updateRole as updateRoleService } from "../services/service.update.role.js";

const updateRoleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }

    const { name } = parsed.data;

    const existing = await getRoleById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    const duplicate = await findRoleByName(name, existing.branch_id);
    if (duplicate && duplicate.id !== id) {
      return res.status(409).json({ success: false, message: "Role with this name already exists in this branch" });
    }

    const role = await updateRoleService(id, name);
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
};
