import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import routes from "./index.js";
import "./prisma/client.js";
import { CREDENTIALS } from "./constant/credentials.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server, etc.)
      if (!origin) return callback(null, true);
      const allowedOrigins = (CREDENTIALS.ALLOWED_ORIGIN || "")
        .split(",")
        .map((url) => url.trim());
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message:
      "Welcome to the ValueTech API. Please refer to the documentation for available endpoints.",
  });
});

app.use("/api/v1", routes);

export default app;
