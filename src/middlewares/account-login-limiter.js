import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const accountLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const employeeId = req.body?.employee_id;
    return typeof employeeId === "string" && employeeId.trim()
      ? `acct:${employeeId.trim().toLowerCase()}`
      : ipKeyGenerator(req.ip);
  },
  message: {
    success: false,
    message:
      "Too many login attempts for this account. Please try again later.",
  },
});
