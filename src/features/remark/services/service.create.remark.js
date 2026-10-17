import prisma from "../../../prisma/client.js";
import { remarkInclude, shapeRemark } from "./remark.service.helpers.js";

// The branch/department/role names are snapshotted alongside the relation ids
// so a remark keeps reading correctly even if the user, branch, department or
// role backing it is later renamed, deactivated or deleted.
export const createRemark = async (data) => {
  const {
    content,
    case_id,
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

  const remark = await prisma.remark.create({
    data: {
      content,
      case: { connect: { id: case_id } },
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
    include: remarkInclude,
  });

  return shapeRemark(remark);
};
