import rateLimit from "express-rate-limit";

// Stricter than globalLimiter, scoped to /auth/login only. Login is the one
// endpoint where the global 300-req/15min budget is far too permissive —
// it's plenty of headroom for credential-stuffing/brute-force against a
// single account. Counted per-IP regardless of outcome (success or failure)
// to keep this simple and avoid giving an attacker a way to tell, from
// response timing/behavior, whether they're about to get throttled.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // login attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});
