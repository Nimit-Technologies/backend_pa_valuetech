import { forgotPasswordSchema } from "../password.schema.js";
import { getUserByEmployeeId } from "../services/service.getByEmployeeId.js";
import { replaceUserResetTokens } from "../services/service.passwordResetToken.user.js";
import {
  generateResetToken,
  RESET_TOKEN_TTL_MINUTES,
} from "../utils/password.util.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

/**
 * POST /api/v1/user/forgot-password  (public, rate-limited)
 *
 * Requires the `password_reset_tokens` table — run `npm run migrate` first.
 *
 * The response is intentionally identical whether or not the account exists
 * or is active: this endpoint must not be usable to enumerate valid
 * employee IDs (OWASP "Forgot Password" cheat sheet).
 */
const GENERIC_RESPONSE = {
  success: true,
  message:
    "If that employee ID matches an active account, a password reset link has been sent.",
};

export const forgotPassword = async (req, res) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { employee_id } = parsed.data;
    const user = await getUserByEmployeeId(employee_id);

    if (user && user.is_active && !user.deleted_at) {
      const { token, tokenHash, expiresAt } = generateResetToken();
      await replaceUserResetTokens(user.id, tokenHash, expiresAt);

      logAuthEvent("password_reset_requested", {
        user_id: user.id,
        employee_id: user.employee_id,
        ip: req.ip,
        success: true,
      });

      // TODO(mailer): deliver this token to the user's registered email as a
      // reset link, e.g. `${APP_BASE_URL}/reset-password?token=${token}`.
      // No mail transport is wired up yet — until one is, the token is only
      // logged server-side in non-production so the flow can be exercised.
      if (process.env.NODE_ENV !== "production") {
        console.log(
          JSON.stringify({
            event: "password_reset_token_debug",
            user_id: user.id,
            employee_id: user.employee_id,
            token,
            expires_in_minutes: RESET_TOKEN_TTL_MINUTES,
          }),
        );
      }
    } else {
      logAuthEvent("password_reset_requested", {
        employee_id,
        ip: req.ip,
        success: false,
        reason: "no_active_account",
      });
    }

    return res.status(200).json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to process the request" });
  }
};
