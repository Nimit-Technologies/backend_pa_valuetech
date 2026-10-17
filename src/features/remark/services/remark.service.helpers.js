const relationSelect = { select: { id: true, name: true } };

const userSelect = {
  select: { id: true, first_name: true, last_name: true, employee_id: true },
};

export const remarkInclude = {
  user: userSelect,
  branch: relationSelect,
  department: relationSelect,
  role: relationSelect,
};

// `is_edited` is derived rather than stored: remarks keep no edit history, so
// the only thing a reader can be told is that the current text is not the
// original. Comparing the two timestamps gives that for free.
export const shapeRemark = (remark) => {
  if (!remark) return remark;

  return {
    ...remark,
    is_edited: remark.updated_at > remark.created_at,
  };
};
