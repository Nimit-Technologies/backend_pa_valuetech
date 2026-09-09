import { changePasswordSchema } from "../password.schema.js";
import {
  getUserAuthById,
  updateUserPassword,
} from "../services/service.password.user.js";
import { hashPassword, verifyPassword } from "../utils/password.util.js";
import { COOKIE_OPTIONS } from "../../../constant/cookie-option.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { createUserHistoryEntry } from "../utils/user-history.js";

/**
 * PATCH /api/v1/user/change-password  (isAuthenticated)
 *
 * The logged-in user changes their OWN password. Separate from the admin
 * PUT /user/update/:id path on purpose:
 *   - it always requires the current password, and
 *   - it never touches any other field.
 */
export const changePassword = async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { current_password, new_password } = parsed.data;
    const userId = req.user.id;

    const user = await getUserAuthById(userId);
    // isAuthenticated already vouches for the token, but re-check live state
    // so a just-deactivated account can't rotate its own credential.
    if (!user || !user.is_active || user.deleted_at) {
      return res.status(401).json({
        success: false,
        message:
          "Account is no longer active. Please contact your administrator.",
      });
    }

    const currentMatches = await verifyPassword(
      current_password,
      user.password,
    );
    if (!currentMatches) {
      logAuthEvent("password_change_failed", {
        user_id: userId,
        employee_id: user.employee_id,
        ip: req.ip,
        success: false,
        reason: "wrong_current_password",
      });
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    // Reject a no-op change — otherwise a user re-submitting their existing
    // password would bump token_version and get logged out for nothing.
    const sameAsCurrent = await verifyPassword(new_password, user.password);
    if (sameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    const hashed = await hashPassword(new_password);
    const historyEntry = createUserHistoryEntry("PASSWORD_CHANGE", req.user);
    await updateUserPassword(userId, hashed, historyEntry, user.history);

    logAuthEvent("password_changed", {
      user_id: userId,
      employee_id: user.employee_id,
      ip: req.ip,
      success: true,
    });

    // token_version was just bumped, so this request's own cookie is now
    // stale — clear it so the client is forced to log back in with the new
    // password (consistent with logout / admin-update behavior).
    res.clearCookie("token", COOKIE_OPTIONS);
    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
};
