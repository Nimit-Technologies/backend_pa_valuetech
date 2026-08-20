import { z } from "zod";

export const businessTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100)
    .transform((val) => val.trim().toLowerCase()),
});

export const updateBusinessTypeSchema = z
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
