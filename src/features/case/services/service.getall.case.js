import { CREDENTIALS } from "../../../constant/credentials.js";
import { PAGINATION_DIRECTION } from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";
import { caseListInclude, shapeCase } from "./case.service.helpers.js";
import { getCaseCounts } from "../utils/case-count.js";

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

const buildSearchFilter = (search) => {
  if (!search) return null;

  return {
    OR: [
      { file_number: { contains: search, mode: "insensitive" } },
      { customer_name: { contains: search, mode: "insensitive" } },
      { banker_name: { contains: search, mode: "insensitive" } },
      { case_type: { contains: search, mode: "insensitive" } },
      { customer_contact_number: { contains: search } },
    ],
  };
};

// Used instead of the cached getCaseCounts() whenever the list is filtered by
// search and/or branch: the cache tracks the global total, which would be
// wrong for a search result or for a branch-scoped caller.
const getScopedCaseCounts = async ({ branchId, searchFilter } = {}) => {
  const groups = await prisma.case.groupBy({
    by: ["is_active"],
    where: {
      deleted_at: null,
      ...(branchId && { branch_id: branchId }),
      ...(searchFilter ?? {}),
    },
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

export const getAllCases = async (query) => {
  const dataLimit = parseInt(`${CREDENTIALS.DATA_LIMIT}`);
  const direction = String(query.direction || PAGINATION_DIRECTION.NEXT);
  const cursorId = String(query.cursorId || "");
  const search = String(query.search ?? "").trim();
  // A non-super-admin only ever sees cases in their own branch.
  const branchId = query.branchId;

  if (!VALID_DIRECTIONS.includes(direction)) {
    const error = new Error(
      `Invalid direction "${direction}". Expected "${PAGINATION_DIRECTION.NEXT}" or "${PAGINATION_DIRECTION.PREVIOUS}".`,
    );
    error.status = 400;
    throw error;
  }

  const filter = { deleted_at: null };
  if (branchId) filter.branch_id = branchId;
  let orderBy = { id: "asc" };

  if (cursorId) {
    if (direction === PAGINATION_DIRECTION.NEXT) {
      filter.id = { gt: cursorId };
    } else if (direction === PAGINATION_DIRECTION.PREVIOUS) {
      filter.id = { lt: cursorId };
      orderBy = { id: "desc" };
    }
  }

  const searchFilter = buildSearchFilter(search);
  if (searchFilter) Object.assign(filter, searchFilter);

  const [initialCases, counts] = await Promise.all([
    prisma.case.findMany({
      where: filter,
      orderBy,
      take: dataLimit + 1,
      include: caseListInclude,
    }),
    search || branchId
      ? getScopedCaseCounts({ branchId, searchFilter })
      : getCaseCounts(),
  ]);

  const totalCount = counts.total;
  const totalActiveCount = counts.active;

  if (!initialCases.length) {
    return {
      cases: [],
      caseFirstId: null,
      caseLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      caseLength: 0,
      totalCount,
      totalActiveCount,
      dataLimit,
    };
  }

  const hasMore = initialCases.length > dataLimit;

  if (hasMore) initialCases.pop();
  const orderedCases =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialCases.reverse()
      : initialCases;
  // Same created_by / deleted_by shape as every other case endpoint
  // (create/update/getById/restore/softDelete).
  const finalCases = orderedCases.map(shapeCase);

  return {
    cases: finalCases,
    caseFirstId: finalCases[0]?.id,
    caseLastId: finalCases[finalCases.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,

    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,
    caseLength: finalCases.length,
    totalCount,
    totalActiveCount,
    dataLimit,
  };
};
