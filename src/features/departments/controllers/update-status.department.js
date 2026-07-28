import { getDepartmentById } from "../services/service.getById.department.js";
import { setDepartmentStatus } from "../services/service.updateStatus.department.js";

export const updateDepartmentStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getDepartmentById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        if (existing.deleted_at) {
            return res.status(409).json({ success: false, message: "Department is soft-deleted; restore it before changing status" });
        }

        const is_active = !existing.is_active;
        const department = await setDepartmentStatus(id, is_active);
        res.json({ success: true, message: `Department ${is_active ? "activated" : "deactivated"} successfully`, data: department });
    } catch (error) {
        console.error("updateDepartmentStatus error:", error);
        res.status(500).json({ success: false, message: "Failed to update department status" });
    }
};
