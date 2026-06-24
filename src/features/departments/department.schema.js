import { z } from "zod";

export const departmentSchema = z.object({
    name: z.string().min(1, "Name is required").max(100).transform((val) => val.trim().toLowerCase()),
    branch_id: z.string().min(1, "Branch ID is required"),
});
