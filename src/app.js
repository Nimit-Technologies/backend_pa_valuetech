import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Mount feature routes here as they are built, e.g.:
// import authRoutes from "./features/auth/auth.routes.js";
// app.use("/api/auth", authRoutes);

export default app;
