import { z } from "zod";

export const addressSchema = z.object({
    lane: z.string().max(200).optional(),
    landmark: z.string().max(200).optional(),
    city: z.string().min(1, "City is required").max(100),
    district: z.string().min(1, "District is required").max(100),
    state: z.string().min(1, "State is required").max(100),
    pin_code: z.string().regex(/^\d{6}$/, "Pin code must be exactly 6 digits"),
    country: z.string().max(100).default("India"),
});
