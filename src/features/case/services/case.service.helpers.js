export const branchSelect = { select: { id: true, name: true } };

export const businessTypeSelect = { select: { id: true, name: true } };

export const bankSelect = {
  select: {
    id: true,
    name: true,
    display_name: true,
    bank_branch: true,
    bank_branch_code: true,
  },
};

export const employeeSelect = {
  select: { id: true, first_name: true, last_name: true, employee_id: true },
};

const updateHistorySelect = {
  orderBy: { updated_at: "asc" },
  select: {
    id: true,
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
  employee: employeeSelect,
  address: true,
};

export const caseInclude = {
  ...caseRelations,
  update_history: updateHistorySelect,
};

// The list view leaves out address and update_history: one page can hold many
// cases, and neither is needed to render a row. Both come back on getById.
export const caseListInclude = {
  branch: branchSelect,
  bank: bankSelect,
  business_type: businessTypeSelect,
  employee: employeeSelect,
};

// Collapses the eight flat snapshot columns into created_by / deleted_by
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
