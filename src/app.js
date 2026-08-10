import express      from "express";
import cookieParser  from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import routes from "./index.js";
import "./prisma/client.js";
import { CREDENTIALS } from "./constant/credentials.js";
import { globalLimiter } from "./middlewares/global-limiter.js";
import { globalErrorHandler } from "./middlewares/global-error-handler.js";

const app = express();
app.use(globalLimiter);
app.use(express.json({ limit: CREDENTIALS.BODY_LIMIT }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: CREDENTIALS.BODY_LIMIT }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      const allowedOrigins = Array.isArray(CREDENTIALS.ALLOWED_ORIGIN)
        ? CREDENTIALS.ALLOWED_ORIGIN
        : (CREDENTIALS.ALLOWED_ORIGIN || "").split(",").map((url) => url.trim());
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  })
);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// -- Health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});



// -- API Routes --
app.use("/api/v1", routes);



// -- Global Error Handler --
app.use(globalErrorHandler);
export default app;
