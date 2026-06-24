import prisma from "../../../prisma/client.js";

export const updateUser = (id, data) => {
  const { branch_id, department_id, role_id, ...rest } = data;

  return prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(branch_id     && { branch:     { connect: { id: branch_id } } }),
      ...(department_id && { department: { connect: { id: department_id } } }),
      ...(role_id       && { role:       { connect: { id: role_id } } }),
    },
  });
};
