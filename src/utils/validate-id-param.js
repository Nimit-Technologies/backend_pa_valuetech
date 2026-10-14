import { isValidCuid, looksLikeAnId } from "./is-valid-cuid.js";

/**
 * Guards a `:id` route param, following the same respondIf* contract as
 * respondIfInvalidParent: returns true when it has already answered the
 * request (or handed it back to Express) and the caller must return.
 *
 * Extracted from the block the branch/bank controllers repeat inline; the
 * behaviour is identical, including the fall-through below.
 */
export const respondIfInvalidIdParam = (req, res, next) => {
  const { id } = req.params;

  if (isValidCuid(id)) return false;

  if (!looksLikeAnId(id)) {
    // Not even shaped like an id — most likely a mistyped/renamed route
    // falling through to :id. Let Express keep matching so app.js's
    // catch-all reports the real "Route not found".
    next();
    return true;
  }

  res.status(404).json({ success: false, message: "Id is not valid" });
  return true;
};
