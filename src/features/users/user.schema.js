import { z } from "zod";
import {
  addressSchema,
  partialAddressSchema,
} from "../address/address.schema.js";

import { passwordPolicy } from "./password.schema.js";

export const userSchema = z.object({
  employee_id: z
    .string()
    .min(1, "Employee ID is required")
    .max(50)
    .transform((val) => val.trim().toLowerCase()),
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(50)
    .transform((val) => val.trim().toLowerCase()),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(50)
    .transform((val) => val.trim().toLowerCase()),
  email: z
    .string()
    .email("Invalid email format")
    .max(100)
    .transform((val) => val.trim().toLowerCase())
    .optional(),
  phone: z
    .string()
    .min(10, "Phone number is required")
    .max(10, "Phone number must be 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  password: passwordPolicy,
  aadhaar_number: z
    .string()
    .length(12, "Aadhaar number must be 12 digits")
    .regex(/^\d+$/, "Aadhaar number must contain only digits")
    .transform((val) => val.trim()),

  branch_id: z.string().min(1, "Branch is required"),
  department_id: z.string().min(1, "Department is required"),
  role_id: z.string().min(1, "Role is required"),

  address: addressSchema,
});

/**
 * POST /api/v1/user/get-aadhaar  (authenticated admin — reveal a user's
 * Aadhaar number in the clear). The caller identifies the user by their
 * employee_id; the same value login uses, normalised the same way.
 */
export const aadhaarLookupSchema = z
  .object({
    employee_id: z
      .string()
      .min(1, "Employee ID is required")
      .max(50)
      .trim()
      .toLowerCase(),
  })
  .strict();

export const updateUserSchema = z
  .object({
    employee_id: z
      .string()
      .min(1)
      .max(50)
      .transform((val) => val.trim().toLowerCase())
      .optional(),
    first_name: z
      .string()
      .min(1)
      .max(50)
      .transform((val) => val.trim().toLowerCase())
      .optional(),
    last_name: z
      .string()
      .min(1)
      .max(50)
      .transform((val) => val.trim().toLowerCase())
      .optional(),
    email: z
      .string()
      .email()
      .max(100)
      .transform((val) => val.trim().toLowerCase())
      .optional(),
    phone: z
      .string()
      .length(10, "Phone number must be 10 digits")
      .regex(/^\d+$/, "Phone must contain only digits")
      .optional(),
    password: passwordPolicy.optional(),
    confirm_password: z.string().optional(),
    aadhaar_number: z
      .string()
      .length(12, "Aadhaar number must be 12 digits")
      .regex(/^\d+$/, "Aadhaar number must contain only digits")
      .transform((val) => val.trim())
      .optional(),
    branch_id: z.string().min(1).optional(),
    department_id: z.string().min(1).optional(),
    role_id: z.string().min(1).optional(),
    is_active: z.boolean().optional(),
    address: partialAddressSchema.optional(),
  })
  .strict();
