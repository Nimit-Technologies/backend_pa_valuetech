import prisma from "../../../prisma/client.js";

const relationSelect = { select: { id: true, name: true } };
const userSelect = {
  select: { id: true, first_name: true, last_name: true, employee_id: true },
};

export const createRemark = (data) => {
  const {
    content,
    user_id,
    branch_id,
    department_id,
    role_id,
    first_name,
    employee_id,
    branch_name,
    department_name,
    role_name,
  } = data;

  return prisma.remark.create({
    data: {
      content,
      user: { connect: { id: user_id } },
      branch: { connect: { id: branch_id } },
      department: { connect: { id: department_id } },
      role: { connect: { id: role_id } },
      first_name,
      employee_id,
      branch_name,
      department_name,
      role_name,
    },
    include: {
      user: userSelect,
      branch: relationSelect,
      department: relationSelect,
      role: relationSelect,
    },
  });
};
