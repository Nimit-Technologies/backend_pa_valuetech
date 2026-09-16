import { CREDENTIALS } from "../../../constant/credentials.js";
import { PAGINATION_DIRECTION } from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";
import { getDepartmentCounts } from "../utils/department-count.js";
import { branchSelect } from "./department.service.helpers.js";

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

const DEFAULT_DATA_LIMIT = 10;
const parsedDataLimit = parseInt(CREDENTIALS.DATA_LIMIT, 10);
const DATA_LIMIT =
  Number.isInteger(parsedDataLimit) && parsedDataLimit > 0
    ? parsedDataLimit
    : DEFAULT_DATA_LIMIT;

const OMIT_HISTORY = process.env.NODE_ENV !== "development";

const getSearchDepartmentCounts = async (nameFilter) => {
  const groups = await prisma.department.groupBy({
    by: ["is_active"],
    where: { deleted_at: null, name: nameFilter },
    _count: { _all: true },
  });

  let total = 0;
  let active = 0;
  for (const { is_active, _count } of groups) {
    total += _count._all;
    if (is_active) active += _count._all;
  }
  return { total, active };
};

// {{DEPARTMENT_BASE_URL}}/all-department?direction=next&cursorId=""&search=""
export const getAllDepartments = async (params = {}) => {
  const direction = String(params.direction || PAGINATION_DIRECTION.NEXT);
  const cursorId = String(params.cursorId || "");
  const search = String(params.search ?? "").trim();

  if (!VALID_DIRECTIONS.includes(direction)) {
    const error = new Error(
      `Invalid direction "${direction}". Expected "${PAGINATION_DIRECTION.NEXT}" or "${PAGINATION_DIRECTION.PREVIOUS}".`,
    );
    error.status = 400;
    throw error;
  }

  const filter = {};
  let orderBy = { id: "asc" };

  if (cursorId) {
    if (direction === PAGINATION_DIRECTION.NEXT) {
      filter.id = { gt: cursorId };
    } else if (direction === PAGINATION_DIRECTION.PREVIOUS) {
      filter.id = { lt: cursorId };
      orderBy = { id: "desc" };
    }
  }

  if (search) {
    filter.name = { contains: search, mode: "insensitive" };
  }

  const [initialDepartments, counts] = await Promise.all([
    prisma.department.findMany({
      where: filter,
      orderBy,
      take: DATA_LIMIT + 1,
      omit: { history: OMIT_HISTORY },
      include: { branch: branchSelect },
    }),
    search ? getSearchDepartmentCounts(filter.name) : getDepartmentCounts(),
  ]);

  const totalCount = counts.total;
  const totalActiveCount = counts.active;

  if (!initialDepartments.length) {
    return {
      departments: [],
      departmentFirstId: null,
      departmentLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      departmentLength: 0,
      totalCount,
      totalActiveCount,
      dataLimit: DATA_LIMIT,
    };
  }

  const hasMore = initialDepartments.length > DATA_LIMIT;

  if (hasMore) initialDepartments.pop();
  const orderedDepartments =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialDepartments.reverse()
      : initialDepartments;

  return {
    departments: orderedDepartments,
    departmentFirstId: orderedDepartments[0]?.id,
    departmentLastId: orderedDepartments[orderedDepartments.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,
    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,
    departmentLength: orderedDepartments.length,
    totalCount,
    totalActiveCount,
    dataLimit: DATA_LIMIT,
  };
};
