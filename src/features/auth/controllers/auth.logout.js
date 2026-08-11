import jwt from "jsonwebtoken";
import { CREDENTIALS } from "../../../constant/credentials.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export const logout = (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    res.clearCookie("token", COOKIE_OPTIONS);
    return res
      .status(401)
      .json({ success: false, message: "Please login first" });
  }

  try {
    jwt.verify(token, CREDENTIALS.JWT_SECRET);
  } catch {
    // invalid/expired token; cookie is cleared below regardless of outcome
  }

  res.clearCookie("token", COOKIE_OPTIONS);
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};
