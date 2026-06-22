import { getRoleById } from "../services/service.getById.role.js";
import { deleteRole as deleteRoleService } from "../services/service.delete.role.js";

export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getRoleById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        await deleteRoleService(id);
        res.json({ success: true, message: "Role deleted successfully" });
    } catch (error) {
        console.error("deleteRole error:", error);
        res.status(500).json({ success: false, message: "Failed to delete role" });
    }
};
