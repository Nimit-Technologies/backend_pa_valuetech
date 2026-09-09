import { getUserById } from "../services/service.getById.user.js";
import { softDeleteUser as softDeleteUserService } from "../services/service.softDelete.user.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createUserHistoryEntry,
  formatUserResponse,
} from "../utils/user-history.js";

export const softDeleteUser = async (req, res, next) => {
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

    const existing = await getUserById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "User is already deleted" });
    }

    const historyEntry = createUserHistoryEntry("SOFT_DELETE", req.user);
    const user = await softDeleteUserService(
      id,
      historyEntry,
      existing.history,
    );

    logAuthEvent("user_soft_deleted", {
      user_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "User soft-deleted successfully",
      data: formatUserResponse(user),
    });
  } catch (error) {
    console.error("softDeleteUser error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to soft-delete user" });
  }
};
