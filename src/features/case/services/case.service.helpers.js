import { remarkInclude } from "../../remark/services/remark.service.helpers.js";

export const branchSelect = { select: { id: true, name: true } };

export const businessTypeSelect = { select: { id: true, name: true } };

export const statusSelect = {
  select: { id: true, code: true, name: true, is_terminal: true },
};

export const bankSelect = {
  select: {
    id: true,
    name: true,
    display_name: true,
    bank_branch: true,
    bank_branch_code: true,
  },
};

// `phone` rides along because the assigned engineer is someone the branch
// staff ring up from the case itself; the detail view shows it beside the name.
export const employeeSelect = {
  select: {
    id: true,
    first_name: true,
    last_name: true,
    employee_id: true,
    phone: true,
  },
};

// The list view shows the property address in a column, so the relation rides
// along — but through an explicit select rather than `address: true`, which
// would also ship `search_text`: a long derived string the trigram search uses
// and no client has any reason to read.
export const addressListSelect = {
  select: {
    id: true,
    lane: true,
    landmark: true,
    city: true,
    district: true,
    state: true,
    pin_code: true,
    country: true,
  },
};

const updateHistorySelect = {
  orderBy: { updated_at: "asc" },
  select: {
    id: true,
    action: true,
    from_status: true,
    to_status: true,
    reason: true,
    updated_by_id: true,
    first_name: true,
    employee_id: true,
    role: true,
    department: true,
    updated_at: true,
  },
};

const caseRelations = {
  branch: branchSelect,
  bank: bankSelect,
  business_type: businessTypeSelect,
  status: statusSelect,
  employee: employeeSelect,
  address: true,
};

export const caseInclude = {
  ...caseRelations,
  update_history: updateHistorySelect,
};

// How many remarks ride along on the case detail. A chatty case can hold
// hundreds, and the detail view is not where the whole thread is read — the
// client pages through `GET /remark/:caseId` for the rest.
export const REMARK_PREVIEW_LIMIT = 20;

// Borrowing the remark feature's own include keeps one definition of what a
// remark looks like on the wire: a field added for `GET /remark/:caseId` shows
// up here too, instead of the two shapes drifting apart.
//
// Newest first, matching that endpoint's ordering. One row over the limit is
// fetched so the caller can tell a full page from the end of the thread.
const remarkPreview = {
  include: remarkInclude,
  orderBy: { created_at: "desc" },
  take: REMARK_PREVIEW_LIMIT + 1,
};

// getById only. The six write paths share caseInclude and have no reason to
// carry the thread back with them — a transition response is about the
// transition, not the conversation.
export const caseDetailInclude = {
  ...caseInclude,
  remarks: remarkPreview,
};

// The list view leaves out update_history and remarks: one page can hold many
// cases and neither is needed to render a row — both come back on getById. The
// address is included, trimmed to its displayable columns, because the list
// table shows it per row.
export const caseListInclude = {
  branch: branchSelect,
  bank: bankSelect,
  business_type: businessTypeSelect,
  status: statusSelect,
  employee: employeeSelect,
  address: addressListSelect,
};

// Collapses the flat snapshot columns into created_by / updated_by / deleted_by
// objects so a response carries one shape per actor instead of a relation and
// four loose columns beside it. The snapshot — not the live relation — is the
// authoritative value: it is what the actor looked like at the time of the
// write, even if the user has since been renamed or moved.
export const shapeCase = (caseRecord) => {
  if (!caseRecord) return caseRecord;

  const {
    created_by_first_name,
    created_by_employee_id,
    created_by_role,
    created_by_department,
    updated_by_first_name,
    updated_by_employee_id,
    updated_by_role,
    updated_by_department,
    updated_by_at,
    deleted_by_first_name,
    deleted_by_employee_id,
    deleted_by_role,
    deleted_by_department,
    ...rest
  } = caseRecord;

  return {
    ...rest,
    created_by: {
      id: rest.created_by_id,
      first_name: created_by_first_name,
      employee_id: created_by_employee_id,
      role: created_by_role,
      department: created_by_department,
    },
    // Null until the case's data is edited for the first time. A client
    // rendering "last modified by" falls back to created_by, which keeps
    // "never edited" distinguishable from "edited by whoever created it".
    updated_by: rest.updated_by_id
      ? {
          id: rest.updated_by_id,
          first_name: updated_by_first_name,
          employee_id: updated_by_employee_id,
          role: updated_by_role,
          department: updated_by_department,
          at: updated_by_at,
        }
      : null,
    deleted_by: rest.deleted_by_id
      ? {
          id: rest.deleted_by_id,
          first_name: deleted_by_first_name,
          employee_id: deleted_by_employee_id,
          role: deleted_by_role,
          department: deleted_by_department,
        }
      : null,
  };
};
