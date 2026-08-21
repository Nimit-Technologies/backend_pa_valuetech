// Matches the format Prisma's `@default(cuid())` generates: a lowercase "c"
// followed by 24 lowercase base-36 characters (25 chars total), e.g. the
// `id` fields on Branch, Department, Role, User, etc.
const CUID_REGEX = /^c[a-z0-9]{24}$/;

/**
 * Checks whether a value is a well-formed CUID (the id format used across
 * this Prisma schema via `@default(cuid())`). This only validates the
 * shape/format of the string — it does not check whether a record with
 * that id actually exists.
 */
export const isValidCuid = (id) => {
  return typeof id === "string" && CUID_REGEX.test(id);
};

// Looser than CUID_REGEX — no leading "c", and a generous length window
// around 25 instead of exactly 25. Used only to pick which 404 a mismatched
// `:id` route segment gets (see looksLikeAnId below), not as a validity
// check anywhere else.
const PLAUSIBLE_ID_REGEX = /^[a-z0-9]{20,30}$/;

/**
 * True if `id` is shaped enough like an *attempted* cuid — lowercase
 * alphanumeric, no hyphens, roughly the right length — to be worth telling
 * the caller "Id is not valid", as opposed to a mistyped/renamed route
 * (e.g. "all-users") that should fall through to the app's generic
 * "Route ... not found" instead.
 *
 * This is a heuristic, not a guarantee: Express gives a controller no way
 * to know whether a request was ever *meant* to be an id lookup, only the
 * string that landed in the param. It works here because every literal
 * route segment in this app ("all-user", "create-bank", "soft-delete", …)
 * either contains a hyphen or falls well outside this length range — if a
 * future route name is added that's 20-30 lowercase-alnum characters with
 * no hyphen, it would be misclassified as "Id is not valid" instead of
 * "Route not found". Pair with isValidCuid:
 *
 *   if (!isValidCuid(id)) {
 *     if (!looksLikeAnId(id)) return next();   // let routing keep looking
 *     return res.status(404).json({ success: false, message: "Id is not valid" });
 *   }
 */
export const looksLikeAnId = (id) => {
  return typeof id === "string" && PLAUSIBLE_ID_REGEX.test(id);
};
