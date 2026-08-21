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

  // Revoke server-side, not just client-side: bump token_version so this
  // token — and any other copy of it that might exist outside this browser
  // (XSS exfiltration, a proxy/access log, a synced browser session) — is
  // rejected by isAuthenticated from now on, not merely removed from this
  // browser's cookie jar.
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
