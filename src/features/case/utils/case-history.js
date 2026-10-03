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

const relationName = (value) => {
  if (typeof value === "object" && value?.name) return value.name;
  if (typeof value === "string") return value;
  return "N/A";
};

// Unlike Role/Bank/User, Case does not carry a `history` Json column. It keeps
// the actor's identity in immutable columns (created_by_* / deleted_by_*) and
// one CaseUpdateHistory row per update — all three want the same four fields,
// so one snapshot feeds all of them.
//
// Returns null when there is no authenticated actor: created_by_id and
// CaseUpdateHistory.updated_by_id are both required, so a write with no actor
// cannot be attributed and must not be attempted.
export const createCaseIdentitySnapshot = (user) => {
  if (!user?.id) return null;

  return {
    id: user.id,
    // Matches the Remark snapshot convention: the first name alone, not the
    // full name, since the column is named first_name.
    first_name: user.first_name || "N/A",
    employee_id: user.employee_id || "N/A",
    role: relationName(user.role),
    department: relationName(user.department),
  };
};

// Nested-create payload for one CaseUpdateHistory row.
//
// The table has no `action` column, so an update, a soft-delete and a restore
// all land as a plain "this actor touched the case at this time" entry; the
// action itself is recoverable from deleted_at / the audit log.
export const createCaseHistoryEntry = (actor) => {
  if (!actor?.id) return null;

  return {
    updated_by: { connect: { id: actor.id } },
    first_name: actor.first_name,
    employee_id: actor.employee_id,
    role: actor.role,
    department: actor.department,
  };
};

// Columns written when a case is created. Immutable afterwards.
export const createdBySnapshotFields = (actor) => ({
  created_by: { connect: { id: actor.id } },
  created_by_first_name: actor.first_name,
  created_by_employee_id: actor.employee_id,
  created_by_role: actor.role,
  created_by_department: actor.department,
});

// Columns written when a case is soft-deleted, and the same columns cleared
// again on restore.
export const deletedBySnapshotFields = (actor) => ({
  deleted_by: { connect: { id: actor.id } },
  deleted_by_first_name: actor.first_name,
  deleted_by_employee_id: actor.employee_id,
  deleted_by_role: actor.role,
  deleted_by_department: actor.department,
});

export const clearedDeletedBySnapshotFields = () => ({
  deleted_by: { disconnect: true },
  deleted_by_first_name: null,
  deleted_by_employee_id: null,
  deleted_by_role: null,
  deleted_by_department: null,
});

export const formatCaseResponse = (data) => {
  if (!data) return data;

  const isDev = process.env.NODE_ENV === "development";

  const formatSingle = (caseRecord) => {
    if (!caseRecord || typeof caseRecord !== "object") return caseRecord;

    const { update_history, created_at, updated_at, deleted_at, ...rest } =
      caseRecord;

    const base = { ...rest, is_deleted: Boolean(deleted_at) };

    if (isDev) {
      return {
        ...base,
        update_history: (update_history ?? []).map((entry) => ({
          ...entry,
          updated_at: formatDateTime(entry.updated_at),
        })),
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
