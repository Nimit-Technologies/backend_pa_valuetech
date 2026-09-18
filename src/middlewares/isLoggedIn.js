import jwt from "jsonwebtoken";
import { CREDENTIALS } from "../constant/credentials.js";
import { COOKIE_OPTIONS } from "../constant/cookie-option.js";

export const isLoggedIn = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Please login first." });
  }

  try {
    const decoded = jwt.verify(token, CREDENTIALS.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    req.user = decoded;
    return next();
  } catch {
    res.clearCookie("token", COOKIE_OPTIONS);
    return res
      .status(401)
      .json({ success: false, message: "Please login first." });
  }
};
