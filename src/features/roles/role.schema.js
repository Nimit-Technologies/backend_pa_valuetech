import { z } from "zod";

export const roleSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100)
    .transform((val) => val.trim().toLowerCase()),
  department_id: z.string().min(1, "Department ID is required"),
  branch_id: z.string().min(1, "Branch ID is required").optional(),
});

export const updateRoleSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100)
      .transform((val) => val.trim().toLowerCase())
      .optional(),
    is_active: z.boolean().optional(),
  })
  .strict();
