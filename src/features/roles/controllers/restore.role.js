import { getRoleById } from "../services/service.getById.role.js";
import { restoreRole as restoreRoleService } from "../services/service.restore.role.js";
import { getDepartmentById } from "../../departments/services/service.getById.department.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";

export const restoreRole = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getRoleById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        if (!existing.deleted_at) {
            return res.status(409).json({ success: false, message: "Role is not soft-deleted" });
        }

        const department = await getDepartmentById(existing.department_id);
        if (respondIfInvalidParent(res, department, { label: "Department", action: "restore this role" })) return;

        const role = await restoreRoleService(id);
        res.json({ success: true, message: "Role restored successfully", data: role });
    } catch (error) {
        console.error("restoreRole error:", error);
        res.status(500).json({ success: false, message: "Failed to restore role" });
    }
};
