import prisma from "../../../prisma/client.js";
import { STATUS_CODE } from "../../../constant/case-status.js";

const buildTaskFilter = (userId, caseFilter) => ({
  user_id: userId,
  case: caseFilter,
});

export const countMyTasks = async ({ userId, branchId, employeeId }) => {
  const caseFilter = {
    deleted_at: null,
    branch_id: branchId,
    employee_id: employeeId,
  };
  const base = buildTaskFilter(userId, caseFilter);

  const [total, active, visit_completed, report_completed] = await Promise.all([
    prisma.allocation.count({ where: base }),
    prisma.allocation.count({
      where: buildTaskFilter(userId, {
        ...caseFilter,
        status: { is_terminal: false },
      }),
    }),
    prisma.allocation.count({
      where: buildTaskFilter(userId, {
        ...caseFilter,
        status: { code: STATUS_CODE.VISIT_COMPLETED },
      }),
    }),
    // Stage-complete, read off the stamp the transition endpoint writes rather
    // than off the case's current status — a case reworked after the engineer
    // finished should not still count as their completed work.
    prisma.allocation.count({
      where: { ...base, completed_at: { not: null } },
    }),
  ]);

  return { total, active, visit_completed, report_completed };
};
