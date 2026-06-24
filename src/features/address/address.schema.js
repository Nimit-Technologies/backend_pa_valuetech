import { z } from "zod";

export const addressSchema = z.object({
    lane:      z.string().max(200).transform((val) => val.trim().toLowerCase() || null).optional(),
    landmark:  z.string().max(200).transform((val) => val.trim().toLowerCase() || null).optional(),
    city:      z.string().min(1, "City is required").max(100).transform((val) => val.trim().toLowerCase()),
    district:  z.string().min(1, "District is required").max(100).transform((val) => val.trim().toLowerCase()),
    state:     z.string().min(1, "State is required").max(100).transform((val) => val.trim().toLowerCase()),
    pin_code:  z.string().trim().regex(/^\d{6}$/, "Pin code must be exactly 6 digits"),
    country:   z.string().max(100).default("India").transform((val) => val.trim().toLowerCase()),
});
