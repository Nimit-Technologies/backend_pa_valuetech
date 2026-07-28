import jwt from "jsonwebtoken";
import { CREDENTIALS } from "../constant/credentials.js";

export const isAuthenticated = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Your session has expired. Please log in again." });
  }

  try {
    const decoded = jwt.verify(token, CREDENTIALS.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }

    if (error.name === "NotBeforeError") {
      return res.status(401).json({ success: false, message: "Token not yet active." });
    }

    console.error("isAuthenticated error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
