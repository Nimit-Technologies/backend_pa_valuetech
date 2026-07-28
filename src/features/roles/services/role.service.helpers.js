export const departmentSelect = {
  select: {
    id: true,
    name: true,
    branch: { select: { id: true, name: true } },
  },
};

export const shapeRole = (role) => {
  if (!role) return role;

  const { department, ...rest } = role;

  return {
    ...rest,
    department: department && { id: department.id, name: department.name },
    branch: department?.branch,
  };
};
