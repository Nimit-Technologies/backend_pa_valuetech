import { z } from "zod";

// Signed links are short-lived by design (see uploads.service.js) — this just
// lets a caller ask for less time than the default, never more, so a client
// cannot turn a "quick preview" link into something that outlives the task.
export const MAX_SIGNED_URL_EXPIRY_SECONDS = 300;

export const signedUrlQuerySchema = z
  .object({
    expires_in: z.coerce
      .number()
      .int("expires_in must be a whole number of seconds")
      .min(1, "expires_in must be at least 1 second")
      .max(
        MAX_SIGNED_URL_EXPIRY_SECONDS,
        `expires_in cannot exceed ${MAX_SIGNED_URL_EXPIRY_SECONDS} seconds`,
      )
      .default(MAX_SIGNED_URL_EXPIRY_SECONDS),
  })
  .strict();
