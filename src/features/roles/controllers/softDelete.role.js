import { getRoleById } from "../services/service.getById.role.js";
import { softDeleteRole as softDeleteRoleService } from "../services/service.softDelete.role.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const softDeleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isValidId = isValidCuid(id);

    if (!isValidId) {
      if (!looksLikeAnId(id)) {
        // Not even shaped like an id — most likely a mistyped/renamed
        // route falling through to :id. Let Express keep matching so
        // app.js's catch-all reports the real "Route not found".
        return next();
      }
      return res
        .status(404)
        .json({ success: false, message: "Id is not valid" });
    }

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

    logAuthEvent("role_soft_deleted", {
      role_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

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
