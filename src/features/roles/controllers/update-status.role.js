import { getRoleById } from "../services/service.getById.role.js";
import { setRoleStatus } from "../services/service.updateStatus.role.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createRoleHistoryEntry,
  formatRoleResponse,
} from "../utils/role-history.js";

export const updateRoleStatus = async (req, res, next) => {
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
      return res.status(409).json({
        success: false,
        message: "Role is soft-deleted; restore it before changing status",
      });
    }

    const is_active = !existing.is_active;
    const historyEntry = createRoleHistoryEntry(
      is_active ? "ACTIVATE" : "DEACTIVATE",
      req.user,
    );
    const role = await setRoleStatus(
      id,
      is_active,
      historyEntry,
      existing.history,
    );

    logAuthEvent(is_active ? "role_activated" : "role_deactivated", {
      role_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: `Role ${is_active ? "activated" : "deactivated"} successfully`,
      data: formatRoleResponse(role),
    });
  } catch (error) {
    console.error("updateRoleStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update role status" });
  }
};
