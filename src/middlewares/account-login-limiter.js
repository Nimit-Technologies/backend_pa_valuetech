import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Keyed by employee_id (normalized), independent of source IP. loginLimiter
// caps attempts per IP, but an attacker rotating IPs (botnet/proxy pool)
// against one specific account would otherwise never trip that budget —
// this closes that gap with a per-account window on top of it.
export const accountLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // login attempts per account per window, regardless of source IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const employeeId = req.body?.employee_id;
    return typeof employeeId === "string" && employeeId.trim()
      ? `acct:${employeeId.trim().toLowerCase()}`
      : ipKeyGenerator(req.ip); // no account to key on yet — fall back to IP
  },
  message: {
    success: false,
    message:
      "Too many login attempts for this account. Please try again later.",
  },
});
