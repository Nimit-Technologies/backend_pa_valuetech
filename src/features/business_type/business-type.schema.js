import { z } from "zod";

export const businessTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100)
    .transform((val) => val.trim().toLowerCase()),

  branch_id: z.string().min(1, "Branch ID is required"),
});

export const updateBusinessTypeSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100)
      .transform((val) => val.trim().toLowerCase())
      .optional(),
    branch_id: z.string().min(1, "Branch ID cannot be empty").optional(),
    is_active: z.boolean().optional(),
  })
  .strict();
