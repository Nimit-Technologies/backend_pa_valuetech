import { getDepartmentById } from "../services/service.getById.department.js";
import { softDeleteDepartment as softDeleteDepartmentService } from "../services/service.softDelete.department.js";

export const softDeleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getDepartmentById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }
        if (existing.deleted_at) {
            return res.status(409).json({ success: false, message: "Department is already deleted" });
        }

        const department = await softDeleteDepartmentService(id);
        res.json({ success: true, message: "Department soft-deleted successfully", data: department });
    } catch (error) {
        console.error("softDeleteDepartment error:", error);
        res.status(500).json({ success: false, message: "Failed to soft-delete department" });
    }
};
