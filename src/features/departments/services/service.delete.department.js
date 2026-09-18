import prisma from "../../../prisma/client.js";
import { recordDepartmentTransition } from "../utils/department-count.js";

export const deleteDepartment = async (id) => {
  // Prisma returns the row as it was, which is the "before" side of the
  // transition. A row that was already soft-deleted was not counted, so
  // hard-deleting it moves nothing.
  const department = await prisma.department.delete({ where: { id } });

  recordDepartmentTransition(department, null);
  return department;
};
