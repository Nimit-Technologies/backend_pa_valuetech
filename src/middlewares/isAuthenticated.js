import jwt from "jsonwebtoken";
import { CREDENTIALS } from "../constant/credentials.js";
import { COOKIE_OPTIONS } from "../constant/cookie-option.js";
import prisma from "../prisma/client.js";

export const isAuthenticated = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please log in again.",
    });
  }

  try {
    const decoded = jwt.verify(token, CREDENTIALS.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { is_active: true, deleted_at: true, token_version: true },
    });

    if (!currentUser || !currentUser.is_active || currentUser.deleted_at) {
      res.clearCookie("token", COOKIE_OPTIONS);
      return res.status(401).json({
        success: false,
        message:
          "Account is no longer active. Please contact your administrator.",
      });
    }

    if (currentUser.token_version !== decoded.token_version) {
      res.clearCookie("token", COOKIE_OPTIONS);
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid. Please log in again.",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    }

    if (error.name === "NotBeforeError") {
      return res
        .status(401)
        .json({ success: false, message: "Token not yet active." });
    }

    console.error("isAuthenticated error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};
