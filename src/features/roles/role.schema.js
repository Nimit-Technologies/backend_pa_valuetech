import { z } from "zod";

export const roleSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
});