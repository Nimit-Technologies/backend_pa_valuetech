import { getRoleById } from "../services/service.getById.role.js";
import { setRoleStatus } from "../services/service.updateStatus.role.js";

export const updateRoleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getRoleById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Role is soft-deleted; restore it before changing status",
      });
    }

    const is_active = !existing.is_active;
    const role = await setRoleStatus(id, is_active);
    res.json({
      success: true,
      message: `Role ${is_active ? "activated" : "deactivated"} successfully`,
      data: role,
    });
  } catch (error) {
    console.error("updateRoleStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update role status" });
  }
};
