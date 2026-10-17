import { z } from "zod";

// Status is a global lookup table — it has no branch_id (see status.prisma).
// Both schemas are .strict() so a client that still sends `branch_id` gets a
// 400 naming the offending key instead of having it silently dropped.

const name = z
  .string()
  .min(1, "Name is required")
  .max(100)
  .transform((val) => val.trim().toLowerCase());

// The stable machine key application code branches on. Restricted to
// snake_case so it reads as an identifier rather than a label, and absent from
// updateStatusSchema: renaming a code would silently change the behavior of
// every transition rule that references it.
const code = z
  .string()
  .min(1, "Code is required")
  .max(50)
  .transform((val) => val.trim().toLowerCase())
  .refine((val) => /^[a-z][a-z0-9_]*$/.test(val), {
    message:
      "Code must be lower snake_case — letters, digits and underscores, starting with a letter",
  });

// Negative values are allowed: they let a new status be pushed above the
// existing ones without renumbering the whole table.
const sortOrder = z.number().int("Sort order must be a whole number");

export const statusSchema = z
  .object({
    code,
    name,
    sort_order: sortOrder.optional(),
    // Marks a status as ending the lifecycle. Settable on create so a new
    // terminal outcome can be added alongside close/cancelled.
    is_terminal: z.boolean().default(false),
  })
  .strict();

export const updateStatusSchema = z
  .object({
    name: name.optional(),
    is_active: z.boolean().optional(),
    is_terminal: z.boolean().optional(),
    sort_order: sortOrder.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
