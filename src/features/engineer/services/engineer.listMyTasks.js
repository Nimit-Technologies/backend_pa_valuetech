import prisma from "../../../prisma/client.js";
import {
  DATA_LIMIT,
  PAGINATION_DIRECTION,
} from "../../../constant/pagination.js";
import { taskSelect, shapeTasks } from "../utils/engineer.helpers.js";

const buildCaseSearchFilter = (search) => {
  if (!search) return null;

  return {
    OR: [
      { file_number: { contains: search, mode: "insensitive" } },
      { customer_name: { contains: search, mode: "insensitive" } },
      { case_type: { contains: search, mode: "insensitive" } },
      { customer_contact_number: { contains: search } },
    ],
  };
};

const buildCaseFilter = ({ branchId, employeeId, search, statusCode }) => {
  const caseFilter = {
    deleted_at: null,
    branch_id: branchId,
    employee_id: employeeId,
  };

  if (statusCode) caseFilter.status = { code: statusCode };

  const searchFilter = buildCaseSearchFilter(search);
  if (searchFilter) Object.assign(caseFilter, searchFilter);

  return caseFilter;
};

const buildTaskFilter = (userId, caseFilter) => ({
  user_id: userId,
  case: caseFilter,
});

const buildPaginationQuery = ({ filter, cursorId, direction }) => {
  const where = { ...filter };
  let orderBy = { id: "asc" };

  if (cursorId) {
    if (direction === PAGINATION_DIRECTION.NEXT) {
      where.id = { gt: cursorId };
    } else {
      where.id = { lt: cursorId };
      orderBy = { id: "desc" };
    }
  }

  return { where, orderBy };
};

export const listMyTasks = async ({
  userId,
  branchId,
  employeeId,
  direction,
  cursorId,
  search,
  statusCode,
}) => {
  const caseFilter = buildCaseFilter({
    branchId,
    employeeId,
    search,
    statusCode,
  });
  const filter = buildTaskFilter(userId, caseFilter);
  const { where, orderBy } = buildPaginationQuery({
    filter,
    cursorId,
    direction,
  });

  const [rows, totalCount, totalActiveCount] = await Promise.all([
    prisma.allocation.findMany({
      where,
      orderBy,
      take: DATA_LIMIT + 1,
      select: taskSelect,
    }),
    prisma.allocation.count({ where: filter }),
    prisma.allocation.count({
      where: buildTaskFilter(userId, {
        // Composed onto any status filter already present rather than replacing
        // it, so ?status=... and the active count cannot contradict each other.
        ...caseFilter,
        status: { ...(caseFilter.status ?? {}), is_terminal: false },
      }),
    }),
  ]);

  const hasExtra = rows.length > DATA_LIMIT;
  if (hasExtra) rows.pop();

  const ordered =
    direction === PAGINATION_DIRECTION.PREVIOUS ? [...rows].reverse() : rows;

  const isNext = direction === PAGINATION_DIRECTION.NEXT;

  return {
    tasks: shapeTasks(ordered),
    // Read off the raw rows: the shaped task exposes `task_id`, not `id`.
    taskFirstId: ordered.length ? ordered[0].id : null,
    taskLastId: ordered.length ? ordered[ordered.length - 1].id : null,
    hasNextPage: isNext ? hasExtra : Boolean(cursorId),
    hasPreviousPage: isNext ? Boolean(cursorId) : hasExtra,
    taskLength: ordered.length,
    dataLimit: DATA_LIMIT,
    totalCount,
    totalActiveCount,
  };
};
