import { z } from "zod";
import {
  addressSchema,
  partialAddressSchema,
} from "../address/address.schema.js";

export const bankSchema = z.object({
  name: z
    .string()
    .min(1, "Bank name is required")
    .max(50, "Bank name must be at most 50 characters")
    .transform((val) => val.trim().toLowerCase()),

  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be at most 100 characters")
    .transform((val) => val.trim()),

  bank_branch: z
    .string()
    .min(1, "Branch name is required")
    .max(100, "Branch name must be at most 100 characters")
    .transform((val) => val.trim()),

  gst_number: z
    .string()
    .min(1, "GST number is required")
    .max(20, "GST number must be at most 20 characters")
    .transform((val) => val.trim().toUpperCase()),

  bank_branch_code: z
    .string()
    .min(1, "Branch code is required")
    .max(20, "Branch code must be at most 20 characters")
    .transform((val) => val.trim().toUpperCase()),

  branch_id: z.string().min(1, "Branch ID is required"),

  address: addressSchema,
});

export const updateBankSchema = z
  .object({
    name: z
      .string()
      .min(1, "Bank name cannot be empty")
      .max(100, "Bank name must be at most 100 characters")
      .transform((val) => val.trim().toLowerCase())
      .optional(),

    display_name: z
      .string()
      .min(1, "Display name cannot be empty")
      .max(150, "Display name must be at most 150 characters")
      .transform((val) => val.trim())
      .optional(),
    bank_branch: z
      .string()
      .min(1, "Branch name is required")
      .max(100, "Branch name must be at most 100 characters")
      .transform((val) => val.trim())
      .optional(),
    gst_number: z
      .string()
      .min(1, "GST number cannot be empty")
      .max(20, "GST number must be at most 20 characters")
      .transform((val) => val.trim().toUpperCase())
      .optional(),

    bank_branch_code: z
      .string()
      .min(1, "Branch code cannot be empty")
      .max(20, "Branch code must be at most 20 characters")
      .transform((val) => val.trim().toUpperCase())
      .optional(),

    branch_id: z.string().min(1, "Branch ID cannot be empty").optional(),

    is_active: z.boolean().optional(),

    address: partialAddressSchema.optional(),
  })
  .strict();
