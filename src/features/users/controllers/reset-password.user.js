import { resetPasswordSchema } from "../password.schema.js";
import {
  findResetTokenByRaw,
  deleteResetToken,
} from "../services/service.passwordResetToken.user.js";
import { updateUserPassword } from "../services/service.password.user.js";
import {
  hashPassword,
  verifyResetToken,
  isResetTokenExpired,
} from "../utils/password.util.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { createUserHistoryEntry } from "../utils/user-history.js";

/**
 * POST /api/v1/user/reset-password  (public, rate-limited)
 *
 * Requires the `password_reset_tokens` table — run `npm run migrate` first.
 *
 * One generic error for every rejection (unknown / expired / used / wrong
 * account state) so the endpoint doesn't leak which tokens are real.
 */
const INVALID_TOKEN_RESPONSE = {
  success: false,
  message:
    "This reset link is invalid or has expired. Please request a new one.",
};

export const resetPassword = async (req, res) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { token, new_password } = parsed.data;
    const row = await findResetTokenByRaw(token);

    if (
      !row ||
      row.used_at ||
      isResetTokenExpired(row.expires_at) ||
      !verifyResetToken(token, row.token_hash) ||
      !row.user ||
      !row.user.is_active ||
      row.user.deleted_at
    ) {
      logAuthEvent("password_reset_failed", {
        ip: req.ip,
        success: false,
        reason: "invalid_or_expired_token",
      });
      return res.status(400).json(INVALID_TOKEN_RESPONSE);
    }

    const hashed = await hashPassword(new_password);
    const historyEntry = createUserHistoryEntry("PASSWORD_RESET", {
      first_name: row.user.first_name,
      last_name: row.user.last_name,
      employee_id: row.user.employee_id,
    });

    // Set the new password (bumps token_version → every existing session for
    // this user is invalidated) and burn the single-use token.
    await updateUserPassword(
      row.user.id,
      hashed,
      historyEntry,
      row.user.history,
    );
    await deleteResetToken(row.id);

    logAuthEvent("password_reset", {
      user_id: row.user.id,
      employee_id: row.user.employee_id,
      ip: req.ip,
      success: true,
    });

    return res.status(200).json({
      success: true,
      message: "Password has been reset. Please log in with your new password.",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reset password" });
  }
};
