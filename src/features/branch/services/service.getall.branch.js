import { CREDENTIALS } from "../../../constant/credentials.js";
import { PAGINATION_DIRECTION } from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";
import { getBranchCounts } from "../utils/branch-count.js";

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

const DEFAULT_DATA_LIMIT = 10;
const parsedDataLimit = parseInt(CREDENTIALS.DATA_LIMIT, 10);
const DATA_LIMIT =
  Number.isInteger(parsedDataLimit) && parsedDataLimit > 0
    ? parsedDataLimit
    : DEFAULT_DATA_LIMIT;

const OMIT_HISTORY = process.env.NODE_ENV !== "development";

const getSearchBranchCounts = async (nameFilter) => {
  const groups = await prisma.branch.groupBy({
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
// {{BRANCH_BASE_URL}}/all-branch?direction=next&cursorId=""&search=""
export const getAllBranches = async (params = {}) => {
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

  const [initialBranches, counts] = await Promise.all([
    prisma.branch.findMany({
      where: filter,
      orderBy,
      take: DATA_LIMIT + 1,
      omit: { history: OMIT_HISTORY },
    }),
    search ? getSearchBranchCounts(filter.name) : getBranchCounts(),
  ]);

  const totalCount = counts.total;
  const totalActiveCount = counts.active;

  if (!initialBranches.length) {
    return {
      branches: [],
      branchFirstId: null,
      branchLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      branchLength: 0,
      totalCount,
      totalActiveCount,
      dataLimit: DATA_LIMIT,
    };
  }

  const hasMore = initialBranches.length > DATA_LIMIT;

  if (hasMore) initialBranches.pop();
  const orderedBranches =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialBranches.reverse()
      : initialBranches;

  return {
    branches: orderedBranches,
    branchFirstId: orderedBranches[0]?.id,
    branchLastId: orderedBranches[orderedBranches.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,
    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,
    branchLength: orderedBranches.length,
    totalCount,
    totalActiveCount,
    dataLimit: DATA_LIMIT,
  };
};
