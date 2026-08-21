import { z } from "zod";

export const remarkSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000)
    .transform((val) => val.trim()),
  user_id: z.string().min(1, "User ID is required"),
});
