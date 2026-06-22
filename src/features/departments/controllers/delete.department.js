import { getDepartmentById } from "../services/service.getById.department.js";
import { deleteDepartment as deleteDepartmentService } from "../services/service.delete.department.js";

export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getDepartmentById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        await deleteDepartmentService(id);
        res.json({ success: true, message: "Department deleted successfully" });
    } catch (error) {
        console.error("deleteDepartment error:", error);
        res.status(500).json({ success: false, message: "Failed to delete department" });
    }
};
