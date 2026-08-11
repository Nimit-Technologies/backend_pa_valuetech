import express      from "express";
import cookieParser  from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import routes from "./index.js";
import "./prisma/client.js";

const app = express();
app.use(globalLimiter);
app.use(express.json({ limit: CREDENTIALS.BODY_LIMIT }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// -- Health check
app.get("/", (req, res) => {
  res.json({ status: "app is running !!!!!!!!!!!" });
});



// -- API Routes --
app.use("/api/v1", routes);



// -- Global Error Handler --
app.use(globalErrorHandler);
export default app;
