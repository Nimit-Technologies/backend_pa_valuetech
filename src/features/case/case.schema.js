import { z } from "zod";
import {
  addressSchema,
  partialAddressSchema,
} from "../address/address.schema.js";

export const caseSchema = z.object({
  file_number: z
    .string()
    .min(1, "File number is required")
    .max(50, "File number must be less than 50 characters")
    .transform((value) => value.trim()),

  banker_name: z
    .string()
    .min(1, "Banker name is required")
    .max(50, "Banker name must be less than 50 characters")
    .transform((value) => value.trim().toLowerCase()),

  customer_name: z
    .string()
    .min(1, "Customer name is required")
    .max(50, "Customer name must be less than 50 characters")
    .transform((value) => value.trim().toLowerCase()),

  customer_contact_number: z
    .string()
    .min(10, "Phone number is required")
    .max(10, "Phone number must be 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits")
    .transform((value) => value.trim()),

  case_type: z
    .string()
    .min(1, "Case type is required")
    .max(50, "Case type must be less than 50 characters")
    .transform((value) => value.trim().toLowerCase()),

  is_active: z.boolean().default(true),

  business_type_id: z.string().min(1, "Business type ID is required"),
  bank_id: z.string().min(1, "Bank ID is required"),
  // The employee the case is filed for / handled by, identified by their own
  // employee code rather than a cuid — distinct from created_by_id, which is
  // always the authenticated actor. Lowercased to match how User stores it.
  employee_id: z
    .string()
    .min(1, "Employee ID is required")
    .max(50, "Employee ID must be less than 50 characters")
    .transform((value) => value.trim().toLowerCase()),
  // Optional: a case's branch follows the branch of the bank it is filed
  // under, the same way a role's branch follows its department's. Sending it
  // explicitly only asserts that branch; it is still re-derived server-side.
  branch_id: z.string().min(1, "Branch ID is required"),

  address: addressSchema,
});

export const updateCaseSchema = z
  .object({
    file_number: z
      .string()
      .min(1, "File number cannot be empty")
      .max(50, "File number must be less than 50 characters")
      .transform((value) => value.trim())
      .optional(),

    banker_name: z
      .string()
      .min(1, "Banker name cannot be empty")
      .max(50, "Banker name must be less than 50 characters")
      .transform((value) => value.trim().toLowerCase())
      .optional(),

    customer_name: z
      .string()
      .min(1, "Customer name cannot be empty")
      .max(50, "Customer name must be less than 50 characters")
      .transform((value) => value.trim().toLowerCase())
      .optional(),

    customer_contact_number: z
      .string()
      .min(10, "Phone number must be 10 digits")
      .max(10, "Phone number must be 10 digits")
      .regex(/^\d+$/, "Phone number must contain only digits")
      .transform((value) => value.trim())
      .optional(),

    case_type: z
      .string()
      .min(1, "Case type cannot be empty")
      .max(50, "Case type must be less than 50 characters")
      .transform((value) => value.trim().toLowerCase())
      .optional(),

    is_active: z.boolean().optional(),

    business_type_id: z
      .string()
      .min(1, "Business type ID cannot be empty")
      .optional(),
    bank_id: z.string().min(1, "Bank ID cannot be empty").optional(),
    employee_id: z
      .string()
      .min(1, "Employee ID cannot be empty")
      .max(50, "Employee ID must be less than 50 characters")
      .transform((value) => value.trim().toLowerCase())
      .optional(),
    branch_id: z.string().min(1, "Branch ID cannot be empty").optional(),

    address: partialAddressSchema.optional(),
  })
  .strict();
