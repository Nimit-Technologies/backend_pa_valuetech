import { getUserById } from "../services/service.getById.user.js";
import { setUserStatus } from "../services/service.updateStatus.user.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getUserById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "User is soft-deleted; restore it before changing status",
      });
    }

    const is_active = !existing.is_active;
    const user = await setUserStatus(id, is_active);

    // isAuthenticated re-checks is_active on every request, so this takes
    // effect on the target user's live session immediately — worth a log
    // line independent of the generic update audit trail.
    logAuthEvent(is_active ? "account_activated" : "account_deactivated", {
      user_id: id,
      employee_id: existing.employee_id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: `User ${is_active ? "activated" : "deactivated"} successfully`,
      data: user,
    });
  } catch (error) {
    console.error("updateUserStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update user status" });
  }
};
