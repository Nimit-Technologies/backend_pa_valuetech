import { z } from "zod";
import {
  addressSchema,
  partialAddressSchema,
} from "../address/address.schema.js";

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
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .max(15, "Password must be at most 15 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    )
    .regex(/^\S+$/, "Password must not contain spaces"),
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
    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters")
      .max(15, "Password must be at most 15 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      )
      .regex(/^\S+$/, "Password must not contain spaces")
      .optional(),
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
