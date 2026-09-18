export const departmentSelect = {
  select: {
    id: true,
    name: true,
  },
};

export const branchSelect = {
  select: {
    id: true,
    name: true,
  },
};

export const shapeRole = (role) => {
  if (!role) return role;

  const { department, branch, ...rest } = role;

  return {
    ...rest,
    department: department && { id: department.id, name: department.name },
    branch: branch ? { id: branch.id, name: branch.name } : department?.branch,
  };
};
