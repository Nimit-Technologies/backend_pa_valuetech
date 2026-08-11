import { z } from "zod";
import {
  addressSchema,
  partialAddressSchema,
} from "../address/address.schema.js";

export const bankSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100)
    .transform((val) => val.trim().toLowerCase()),
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(150)
    .transform((val) => val.trim()),
  gst_number: z
    .string()
    .min(1, "GST number is required")
    .max(20)
    .transform((val) => val.trim().toUpperCase()),
  branch_code: z
    .string()
    .min(1, "Branch code is required")
    .max(20)
    .transform((val) => val.trim().toUpperCase()),

  branch_id: z.string().min(1, "Branch ID is required"),

  address: addressSchema,
});

export const updateBankSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(100)
      .transform((val) => val.trim().toLowerCase())
      .optional(),
    display_name: z
      .string()
      .min(1)
      .max(150)
      .transform((val) => val.trim())
      .optional(),
    gst_number: z
      .string()
      .min(1)
      .max(20)
      .transform((val) => val.trim().toUpperCase())
      .optional(),
    branch_code: z
      .string()
      .min(1)
      .max(20)
      .transform((val) => val.trim().toUpperCase())
      .optional(),
    branch_id: z.string().min(1).optional(),
    is_active: z.boolean().optional(),
    address: partialAddressSchema.optional(),
  })
  .strict();
