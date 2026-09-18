import { z } from "zod";

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

const matchesConfirm = (schema) =>
  schema.refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const changePasswordSchema = matchesConfirm(
  z
    .object({
      current_password: z.string().min(1, "Current password is required"),
      new_password: passwordPolicy,
      confirm_password: z.string().min(1, "Confirm password is required"),
    })
    .strict(),
);

export const forgotPasswordSchema = z
  .object({
    employee_id: z
      .string()
      .min(1, "Employee ID is required")
      .max(50)
      .transform((val) => val.trim().toLowerCase()),
  })
  .strict();

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
