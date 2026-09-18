import { z } from "zod";

export const branchSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100)
    .transform((val) => val.trim().toLowerCase()),
  is_active: z.boolean().default(true),
});

export const updateBranchSchema = z
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
