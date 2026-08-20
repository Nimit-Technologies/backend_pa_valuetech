import jwt from "jsonwebtoken";
import { CREDENTIALS } from "../../../constant/credentials.js";
import { COOKIE_OPTIONS } from "../../../constant/cookie-option.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const logout = (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    res.clearCookie("token", COOKIE_OPTIONS);
    return res
      .status(401)
      .json({ success: false, message: "Please login first" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, CREDENTIALS.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    // invalid/expired token; cookie is cleared below regardless of outcome
  }

  logAuthEvent("logout", {
    employee_id: decoded?.employee_id ?? null,
    user_id: decoded?.id ?? null,
    ip: req.ip,
    success: true,
  });

  res.clearCookie("token", COOKIE_OPTIONS);
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};
