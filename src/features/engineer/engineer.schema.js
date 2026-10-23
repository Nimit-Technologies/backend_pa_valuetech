import { z } from "zod";
import { PAGINATION_DIRECTION } from "../../constant/pagination.js";

// Express 5 makes req.query read-only, so the parsed result is used rather than
// written back onto the request.
//
// Unknown keys are stripped rather than rejected: a query string picks up
// cache-busters and UTM noise, and a list endpoint should not 400 because of
// them. The page size is deliberately absent — paging policy belongs to the
// server, per constant/pagination.js.
export const myTaskQuerySchema = z.object({
  direction: z
    .enum([PAGINATION_DIRECTION.NEXT, PAGINATION_DIRECTION.PREVIOUS])
    .default(PAGINATION_DIRECTION.NEXT),

  cursorId: z.string().trim().default(""),

  search: z
    .string()
    .trim()
    .max(100, "Search must be less than 100 characters")
    .default(""),

  // A status *code*, not a name: codes are immutable, so a stored client
  // reference cannot be broken by a super admin renaming the label.
  status: z
    .string()
    .trim()
    .min(1, "Status cannot be empty")
    .transform((value) => value.toLowerCase())
    .optional(),
});

export const mySubmittedReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});
