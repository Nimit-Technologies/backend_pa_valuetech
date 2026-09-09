import rateLimit from "express-rate-limit";

export const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many logout requests. Please try again later.",
  },
});
