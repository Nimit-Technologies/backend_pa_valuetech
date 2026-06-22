import { z } from "zod";
import { addressSchema } from "../address/address.schema.js";

export const userSchema = z.object({
  employee_id:   z.string().min(1, "Employee ID is required").max(50),
  first_name:    z.string().min(1, "First name is required").max(50),
  last_name:     z.string().min(1, "Last name is required").max(50),
  email:         z.string().email("Invalid email format").max(100).optional(),
  phone:         z.string().min(10, "Phone number is required").max(15),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .max(15, "Password must be at most 15 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .regex(/^\S+$/, "Password must not contain spaces"),
  adhar_number:  z.string().length(12, "Aadhar number must be 12 digits"),

  branch_id:     z.string().min(1, "Branch is required"),
  department_id: z.string().min(1, "Department is required"),
  role_id:       z.string().min(1, "Role is required"),

  address: addressSchema,
});
