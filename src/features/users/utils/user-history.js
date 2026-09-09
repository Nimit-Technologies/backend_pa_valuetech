import { decryptStored, maskTail } from "../../../utils/encryption.js";

/**
 * Helper to format date to YYYY-MM-DD HH:mm:ss
 */
const pad = (n) => String(n).padStart(2, "0");

export const formatDateTime = (date = new Date()) => {
  if (!date) return null;
  const dObj = new Date(date);
  if (isNaN(dObj.getTime())) return null;
  const d = `${dObj.getFullYear()}-${pad(dObj.getMonth() + 1)}-${pad(dObj.getDate())}`;
  const t = `${pad(dObj.getHours())}:${pad(dObj.getMinutes())}:${pad(dObj.getSeconds())}`;
  return `${d} ${t}`;
};

/**
 * Creates a standardized user audit history record.
 *
 * @param {string} action - The route/operation action (e.g. "CREATE", "UPDATE", "SOFT_DELETE", "RESTORE", "STATUS_CHANGE")
 * @param {Object} [user] - The req.user object attached by isAuthenticated middleware
 * @returns {Object} History entry object containing date_time, user_full_name, department_name, role_name, branch_name, and employee_id
 */
export const createUserHistoryEntry = (action, user) => {
  const date_time = formatDateTime();
  if (!user) {
    return {
      action,
      date_time,
      user_full_name: "System / Unauthenticated",
      department_name: "N/A",
      role_name: "N/A",
      branch_name: "N/A",
      employee_id: "N/A",
    };
  }

  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const userFullName = `${firstName} ${lastName}`.trim() || "Unknown User";

  const departmentName =
    typeof user.department === "object" && user.department?.name
      ? user.department.name
      : typeof user.department === "string"
        ? user.department
        : "N/A";

  const roleName =
    typeof user.role === "object" && user.role?.name
      ? user.role.name
      : typeof user.role === "string"
        ? user.role
        : "N/A";

  const branchName =
    typeof user.branch === "object" && user.branch?.name
      ? user.branch.name
      : typeof user.branch === "string"
        ? user.branch
        : "N/A";

  return {
    action,
    date_time,
    user_full_name: userFullName,
    department_name: departmentName,
    role_name: roleName,
    branch_name: branchName,
    employee_id: user.employee_id || "N/A",
  };
};

/**
 * Formats user data for API responses.
 * When NODE_ENV === 'development', includes history, created_at, updated_at, and deleted_at (formatted).
 * Otherwise, omits these fields.
 *
 * @param {Object|Array} data - Single user object or array of user objects
 * @returns {Object|Array} Formatted user data
 */
export const formatUserResponse = (data) => {
  if (!data) return data;

  const isDev = process.env.NODE_ENV === "development";

  const formatSingle = (user) => {
    if (!user || typeof user !== "object") return user;

    // The password hash and the Aadhaar blind index must never be returned.
    // The Prisma client already omits both globally; stripping them here too
    // keeps a call site that opts back in from leaking them through a
    // response.
    const {
      password: _password,
      aadhaar_hash: _aadhaarHash,
      history,
      created_at,
      updated_at,
      deleted_at,
      ...rest
    } = user;

    // Aadhaar is stored encrypted; responses only ever expose the last 4
    // digits (e.g. "XXXXXXXX9012"). The full number is available solely via
    // POST /user/get-aadhaar, which is admin-only and audit-logged.
    if ("aadhaar_number" in rest) {
      const revealed = decryptStored(rest.aadhaar_number);
      rest.aadhaar_number = revealed ? maskTail(revealed) : null;
    }

    if (isDev) {
      return {
        ...rest,
        history: history ?? [],
        created_at: formatDateTime(created_at),
        updated_at: formatDateTime(updated_at),
        deleted_at: formatDateTime(deleted_at),
      };
    }

    return rest;
  };

  if (Array.isArray(data)) {
    return data.map(formatSingle);
  }

  return formatSingle(data);
};
