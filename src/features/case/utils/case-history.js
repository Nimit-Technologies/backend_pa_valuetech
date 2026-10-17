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
// the actor's identity in immutable columns (created_by_* / updated_by_* /
// deleted_by_*) and one CaseUpdateHistory row per operation — all of them want
// the same four fields, so one snapshot feeds them all.
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
// `action` says what happened, so an update, a status change and a restore are
// no longer indistinguishable. `from`/`to` carry status codes rather than ids
// so the row keeps reading correctly if a status is renamed or removed, and
// `reason` records why a backward or terminal move was made.
export const createCaseHistoryEntry = (
  actor,
  { action, from, to, reason } = {},
) => {
  if (!actor?.id) return null;

  return {
    action,
    ...(from !== undefined && { from_status: from }),
    ...(to !== undefined && { to_status: to }),
    ...(reason !== undefined && { reason }),
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

// Columns written when a case's *data* changes — a field edit or an
// assignment. Deliberately not written by status transitions, soft-delete or
// restore: those are "last touched", not "last edited", and are recorded in
// update_history instead.
//
// Carries its own timestamp rather than relying on `updated_at`, which Prisma
// bumps on every write and would otherwise show a time that disagrees with the
// identity beside it.
export const updatedBySnapshotFields = (actor) => ({
  updated_by: { connect: { id: actor.id } },
  updated_by_first_name: actor.first_name,
  updated_by_employee_id: actor.employee_id,
  updated_by_role: actor.role,
  updated_by_department: actor.department,
  updated_by_at: new Date(),
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

  const formatSingle = (caseRecord) => {
    if (!caseRecord || typeof caseRecord !== "object") return caseRecord;

    const {
      update_history,
      remarks,
      created_at,
      updated_at,
      deleted_at,
      ...rest
    } = caseRecord;

    // Timestamps and the audit trail are returned in every environment, not
    // just development: the created_by / updated_by snapshots are only half an
    // audit record without the time they happened, and a reassigned engineer
    // needs the history to see the work done before them.
    return {
      ...rest,
      is_deleted: Boolean(deleted_at),
      created_at: formatDateTime(created_at),
      updated_at: formatDateTime(updated_at),
      deleted_at: formatDateTime(deleted_at),
      ...(update_history && {
        update_history: update_history.map((entry) => ({
          ...entry,
          updated_at: formatDateTime(entry.updated_at),
        })),
      }),
      // Only the detail view carries remarks. Their timestamps are formatted
      // the same way as everything else here, so one payload does not mix two
      // date formats — note this makes a remark read through the case look
      // different from the same remark read through `GET /remark/:caseId`,
      // which returns them raw. `is_edited` is already resolved by shapeRemark,
      // before the comparison would be lost to formatting.
      ...(remarks && {
        remarks: remarks.map((remark) => ({
          ...remark,
          created_at: formatDateTime(remark.created_at),
          updated_at: formatDateTime(remark.updated_at),
        })),
      }),
    };
  };

  if (Array.isArray(data)) {
    return data.map(formatSingle);
  }

  return formatSingle(data);
};
