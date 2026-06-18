import express from "express";
import "dotenv/config";
import routes from "./index.js";
import "./prisma/client.js";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({ status: "app is running !!!!!!!!!!!" });
});

app.use("/api/v1", routes);

export default app;
