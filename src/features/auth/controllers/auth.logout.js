import jwt from "jsonwebtoken";
import { CREDENTIALS } from "../../../constant/credentials.js";
import { COOKIE_OPTIONS } from "../../../constant/cookie-option.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { bumpTokenVersion } from "../../users/services/service.tokenVersion.user.js";

export const logout = async (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    res.clearCookie("token", COOKIE_OPTIONS);
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, CREDENTIALS.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    // Invalid/expired token is expected during logout — proceed to clear cookie
  }

  if (decoded?.id) {
    try {
      await bumpTokenVersion(decoded.id);
    } catch (error) {
      console.error("[auth:logout] failed to revoke session:", error);
    }
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
