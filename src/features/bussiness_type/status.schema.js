import { z } from "zod";

export const statusSchema = z.object({
    name: z.string().min(1, "Name is required").max(100).transform((val) => val.trim().toLowerCase()),
    sort_order: z.number().int().optional(),
});

export const updateStatusSchema = z.object({
    name: z.string().min(1, "Name is required").max(100).transform((val) => val.trim().toLowerCase()).optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().optional(),
}).strict();
