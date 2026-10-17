// Hard deletes are destructive and unrecoverable: the row leaves the database
// instead of getting a `deleted_at`, so a mistake cannot be undone and any
// history attached to the row goes with it. Every module that exposes one also
// exposes a soft-delete route, which is what callers are expected to use.
//
// These routes stay mounted so /api/v1 does not change shape, but they refuse
// to act unless the deployment opts in with ALLOW_HARD_DELETE=true, and never
// in production. The refusal is a 404 rather than a 403 so a disabled route is
// indistinguishable from one that was never there.
const isProduction = () => process.env.NODE_ENV === "production";

const isOptedIn = () =>
  String(process.env.ALLOW_HARD_DELETE).toLowerCase() === "true";

export const hardDeleteEnabled = () => !isProduction() && isOptedIn();

export const isHardDeleteAllowed = (req, res, next) => {
  if (hardDeleteEnabled()) return next();

  return res.status(404).json({ success: false, message: "Route not found" });
};
