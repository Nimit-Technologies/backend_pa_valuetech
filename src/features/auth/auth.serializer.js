export const toAuthUser = (src) => {
  if (!src) return null;

  return {
    id: src?.id,
    employee_id: src?.employee_id,
    first_name: src?.first_name,
    last_name: src?.last_name,
    phone: src?.phone,
    role: src?.role ? { id: src?.role.id, name: src?.role.name } : null,
    branch: src?.branch ? { id: src?.branch.id, name: src?.branch.name } : null,
    department: src?.department
      ? { id: src?.department.id, name: src?.department.name }
      : null,
    // Null for every role but coordinator, who handles exactly one business
    // line. The client needs it because POST /case/create-case requires
    // business_type_id and refuses anything but the caller's own with a 403 —
    // without it the create form would have to guess. Already in the token
    // payload (see buildTokenPayload), so this exposes nothing new.
    business_type_id: src?.business_type_id ?? null,
  };
};
