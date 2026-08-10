import rateLimit from "express-rate-limit";

// Applies to every request. Individual routes (e.g. auth) can layer a
// stricter limiter on top of this one.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // requests per IP per window
  standardHeaders: true, // return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    status: "fail",
    message: "Too many requests, please try again later.",
  },
});
