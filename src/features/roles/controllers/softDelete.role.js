import { getRoleById } from "../services/service.getById.role.js";
import { softDeleteRole as softDeleteRoleService } from "../services/service.softDelete.role.js";

export const softDeleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getRoleById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }
    if (existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Role is already deleted" });
    }

    const role = await softDeleteRoleService(id);
    res.json({
      success: true,
      message: "Role soft-deleted successfully",
      data: role,
    });
  } catch (error) {
    console.error("softDeleteRole error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to soft-delete role" });
  }
};
