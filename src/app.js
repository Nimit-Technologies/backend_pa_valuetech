import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import routes from "./index.js";
import { CREDENTIALS } from "./constant/credentials.js";
import { globalLimiter } from "./middlewares/global-limiter.js";
import { globalErrorHandler } from "./middlewares/global-error-handler.js";
import { AppError } from "./utils/app-error.js";

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
