import { z } from "zod";

export const loginSchema = z.object({
  employee_id: z
    .string()
    .min(1, "Employee ID is required")
    .trim()
    .toLowerCase(),
  password: z.string().min(12, "invalid password").max(20, "invalid password"),
});
