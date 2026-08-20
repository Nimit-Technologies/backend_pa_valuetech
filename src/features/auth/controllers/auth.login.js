import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema } from "../auth.schema.js";
import { findUserForLogin } from "../services/service.auth.login.js";
import { CREDENTIALS } from "../../../constant/credentials.js";
import { TOKEN_TTL_SECONDS, COOKIE_OPTIONS } from "../../../constant/cookie-option.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

// Pre-computed hash used to equalize response time when the user
// doesn't exist (prevents user-enumeration via timing analysis).
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer-not-a-real-password", 10);

// One generic message for every credential failure. Different messages
// ("user not found" vs "wrong password" vs "deactivated") let attackers
// enumerate valid employee IDs.
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
});


const buildUserResponse = (user) => ({
  id: user.id,
  employee_id: user.employee_id,
  first_name: user.first_name,
  last_name: user.last_name,
  role: user.role,
  phone: user.phone,
  branch: { branch_id: user.branch.id, name: user.branch.name },
  department: user.department,
});

export const login = async (req, res) => {
  try {
    // 1. Validate input (safeParse also handles missing/non-object body)
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

    // 2. Look up the user
    const user = await findUserForLogin(employee_id);

    // 3. Verify password.
    //    - Always run bcrypt.compare (against a dummy hash if the user is
    //      missing or has no local password) so all failures take the
    //      same time.
    //    - Guards the case where user.password is null/undefined
    //      (e.g. SSO-provisioned accounts), which would otherwise throw.
    const hashToCompare = user?.password ?? DUMMY_HASH;
    const passwordMatches = await bcrypt.compare(password, hashToCompare);

    if (!user || !user.password || !passwordMatches) {
      logAuthEvent("login_failed", {
        employee_id,
        ip: req.ip,
        success: false,
        reason: "invalid_credentials",
      });
      return fail(res, 401, INVALID_CREDENTIALS);
    }

    // 4. Reject deactivated / soft-deleted accounts.
    //    Checked *after* the password so this state is only revealed to
    //    someone who actually knows the credentials.
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

    // 5. Issue the token
    const token = jwt.sign(buildTokenPayload(user), CREDENTIALS.JWT_SECRET, {
      expiresIn: TOKEN_TTL_SECONDS,
      algorithm: "HS256",
    });

    // 6. Deliver it via httpOnly cookie ONLY.
    //    Do not echo the token in the JSON body — that would make it
    //    readable by any XSS payload and defeat httpOnly entirely.
    //    (If you also serve a mobile app that needs a bearer token,
    //    give it a separate endpoint or content negotiation.)
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
      data: buildUserResponse(user),
    });
  } catch (error) {
    // Log internally; never leak internals to the client.
    console.error("[auth:login]", error);
    return fail(res, 500, "Internal server error");
  }
};
