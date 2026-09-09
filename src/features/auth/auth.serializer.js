export const toAuthUser = (src) => {
  if (!src) return null;

  return {
    id: src.id,
    employee_id: src.employee_id,
    first_name: src.first_name,
    last_name: src.last_name,
    phone: src.phone,
    role: src.role ? { id: src.role.id, name: src.role.name } : null,
    branch: src.branch ? { id: src.branch.id, name: src.branch.name } : null,
    department: src.department
      ? { id: src.department.id, name: src.department.name }
      : null,
  };
};
