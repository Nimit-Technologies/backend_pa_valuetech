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

export const formatUserResponse = (data) => {
  if (!data) return data;

  const isDev = process.env.NODE_ENV === "development";

  const formatSingle = (user) => {
    if (!user || typeof user !== "object") return user;

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

    const base = { ...rest, is_deleted: Boolean(deleted_at) };

    if (isDev) {
      return {
        ...base,
        history: history ?? [],
        created_at: formatDateTime(created_at),
        updated_at: formatDateTime(updated_at),
        deleted_at: formatDateTime(deleted_at),
      };
    }

    return base;
  };

  if (Array.isArray(data)) {
    return data.map(formatSingle);
  }

  return formatSingle(data);
};
