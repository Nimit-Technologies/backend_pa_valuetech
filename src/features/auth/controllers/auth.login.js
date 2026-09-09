import jwt from "jsonwebtoken";
import { loginSchema } from "../auth.schema.js";
import { findUserForLogin } from "../services/service.auth.login.js";
import { verifyPassword } from "../../users/utils/password.util.js";
import { CREDENTIALS } from "../../../constant/credentials.js";
import {
  TOKEN_TTL_SECONDS,
  COOKIE_OPTIONS,
} from "../../../constant/cookie-option.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { toAuthUser } from "../auth.serializer.js";

const INVALID_CREDENTIALS = "Invalid employee ID or password";

const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

const buildTokenPayload = (user) => ({
  id: user.id,
  employee_id: user.employee_id,
  first_name: user.first_name,
  last_name: user.last_name,
  role: user.role,
  phone: user.phone,
  branch: { id: user.branch.id, name: user.branch.name },
  department: user.department,
  token_version: user.token_version,
});

export const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 400, "Validation failed", {
        errors: parsed.error.issues.map(({ path, message }) => ({
          field: path.join("."),
          message,
        })),
      });
    }

    const { employee_id, password } = parsed.data;

    const user = await findUserForLogin(employee_id);

    const passwordMatches = await verifyPassword(password, user?.password);

    if (!user || !user.password || !passwordMatches) {
      logAuthEvent("login_failed", {
        employee_id,
        ip: req.ip,
        success: false,
        reason: "invalid_credentials",
      });
      return fail(res, 401, INVALID_CREDENTIALS);
    }

    if (!user.is_active || user.deleted_at) {
      logAuthEvent("login_failed", {
        employee_id,
        user_id: user.id,
        ip: req.ip,
        success: false,
        reason: "account_inactive",
      });
      return fail(
        res,
        403,
        "Account is deactivated. Contact your administrator.",
      );
    }

    const token = jwt.sign(buildTokenPayload(user), CREDENTIALS.JWT_SECRET, {
      expiresIn: TOKEN_TTL_SECONDS,
      algorithm: "HS256",
    });

    res.cookie("token", token, COOKIE_OPTIONS);

    logAuthEvent("login", {
      employee_id: user.employee_id,
      user_id: user.id,
      ip: req.ip,
      success: true,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: toAuthUser(user),
    });
  } catch (error) {
    console.error("[auth:login]", error);
    return fail(res, 500, "Internal server error");
  }
};
