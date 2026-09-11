import rateLimit from "express-rate-limit";

export const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many logout requests. Please try again later.",
  },
});
