import { z } from "zod";

/**
 * Single source of truth for the password strength bar. Applied identically
 * to account creation, admin updates, self-service change, and reset — a
 * reset must never be held to a weaker policy than creation (CWE-521). The
 * max is generous enough that it never truncates a real passphrase, only
 * guards against absurd input.
 *
 * Imported by ./user.schema.js so create/update stay in lockstep with the
 * dedicated password endpoints below.
 */
export const passwordPolicy = z
  .string()
  .trim()
  .min(12, "Password must be at least 12 characters")
  .max(20, "Password must be at most 20 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
  .regex(/^\S+$/, "Password must not contain spaces");

// Attach a field-level "passwords do not match" error to `confirm_password`
// so the client can render it next to the right input.
const matchesConfirm = (schema) =>
  schema.refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

/**
 * PATCH /api/v1/user/change-password  (authenticated — the logged-in user
 * changes their own password). The current password is required so a
 * hijacked session can't silently rotate the credential.
 */
export const changePasswordSchema = matchesConfirm(
  z
    .object({
      current_password: z.string().min(1, "Current password is required"),
      new_password: passwordPolicy,
      confirm_password: z.string().min(1, "Confirm password is required"),
    })
    .strict(),
);

/**
 * POST /api/v1/user/forgot-password  (public — request a reset link).
 * Login is by employee_id, so that's what we take here.
 */
export const forgotPasswordSchema = z
  .object({
    employee_id: z
      .string()
      .min(1, "Employee ID is required")
      .max(50)
      .transform((val) => val.trim().toLowerCase()),
  })
  .strict();

/**
 * POST /api/v1/user/reset-password  (public — consume the reset token).
 * The token is the hex string from generateResetToken().
 */
export const resetPasswordSchema = matchesConfirm(
  z
    .object({
      token: z
        .string()
        .min(1, "Reset token is required")
        .regex(/^[a-f0-9]+$/i, "Invalid reset token"),
      new_password: passwordPolicy,
      confirm_password: z.string().min(1, "Confirm password is required"),
    })
    .strict(),
);
