import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import routes from "./index.js";
import "./prisma/client.js";
import { CREDENTIALS } from "./constant/credentials.js";
import { globalLimiter } from "./middlewares/global-limiter.js";
import { globalErrorHandler } from "./middlewares/global-error-handler.js";
import { AppError } from "./utils/app-error.js";

const app = express();

// Coolify/Traefik terminates TLS and proxies every request through a
// single hop — trust exactly that one hop's X-Forwarded-* headers so
// req.ip / req.secure reflect the real client instead of the proxy.
// Without this, express-rate-limit buckets all visitors under the proxy's
// IP (or throws its X-Forwarded-For validation error) and secure-cookie /
// redirect logic that checks req.secure misbehaves behind TLS termination.
app.set("trust proxy", 1);

// Don't advertise the framework in responses.
app.disable("x-powered-by");

// Security headers (HSTS, X-Content-Type-Options, X-Frame-Options /
// frame-ancestors, a conservative default CSP, etc.) — this is a pure JSON
// API with no server-rendered HTML, so the default policy set is safe here
// without per-route tuning.
app.use(helmet());

app.use(globalLimiter);
app.use(express.json({ limit: `${CREDENTIALS.BODY_LIMIT}mb` }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server, etc.)
      if (!origin) return callback(null, true);
      const allowedOrigins = (CREDENTIALS.ALLOWED_ORIGIN || "")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Route through globalErrorHandler as a proper 403 instead of an
      // untyped Error, which would otherwise fall through to a generic
      // "500 Something went very wrong" response.
      return callback(
        new AppError(`Origin ${origin} not allowed by CORS`, 403),
      );
    },
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.json({ status: 200, message: "server is running fine" });
});

app.get("/health", (req, res) => {
  res.json({ status: 200, message: "server health running fine" });
});

// -- API Routes --
app.use("/api/v1", routes);

// -- Unmatched routes: turn Express's default HTML 404 into the API's JSON
// error shape, and make sure it still goes through globalErrorHandler.
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// -- Global Error Handler --
app.use(globalErrorHandler);
export default app;
