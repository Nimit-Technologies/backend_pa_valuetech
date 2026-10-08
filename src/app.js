import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import routes from "./index.js";
import { CREDENTIALS } from "./constant/credentials.js";
import { globalLimiter } from "./middlewares/global-limiter.js";
import { globalErrorHandler } from "./middlewares/global-error-handler.js";
import { AppError } from "./utils/app-error.js";
import { getDatabaseHealth } from "./utils/db-health.js";

const app = express();

app.set("trust proxy", 1);

app.disable("x-powered-by");

app.use(helmet());

app.use(globalLimiter);
app.use(express.json({ limit: `${CREDENTIALS?.BODY_LIMIT}mb` }));
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = (CREDENTIALS?.ALLOWED_ORIGIN || "")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);
      if (allowedOrigins.includes(origin)) return callback(null, true);

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

// Always 200, even with the database down: Coolify restarts the container on a
// failing healthcheck, which would turn a Supabase outage into a restart loop
// while the process itself is perfectly healthy. Alert on the `database` field
// instead of on the status code.
app.get("/health", async (req, res) => {
  const database = await getDatabaseHealth();

  res.json({
    status: 200,
    message: "server health running fine",
    database: database.ok ? "up" : "down",
    ...(CREDENTIALS?.APP_ENV === "development" && !database.ok
      ? { database_error: database.error, database_code: database.code }
      : {}),
  });
});

// -- API Routes --
app.use("/api/v1", routes);

app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// -- Global Error Handler --
app.use(globalErrorHandler);
export default app;
