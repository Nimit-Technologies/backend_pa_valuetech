import { z } from "zod";

const content = z
  .string()
  .min(1, "Content is required")
  .max(2000)
  .transform((val) => val.trim());

// user_id is deliberately absent: the author is taken from the session, never
// from the body. Editing is gated on being the author, so ownership has to be
// something the caller cannot assert for themselves.
export const remarkSchema = z.object({ content }).strict();

export const updateRemarkSchema = z.object({ content }).strict();
