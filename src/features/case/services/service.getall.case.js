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

// `scopeWhere` comes from resolveCaseScope: branch for a branch admin, branch +
// business type for a coordinator, own assignments for an engineer.
//
// `statusCode` narrows the list to one lifecycle step, which is how an
// engineer's work queue is built — "my cases at visit_schedule" rather than a
// separate endpoint per role. `includeFinished` governs whether terminal cases
// appear at all, so a day-to-day queue is not buried under closed work.
export const getAllCases = async (query) => {
  const dataLimit = parseInt(`${CREDENTIALS.DATA_LIMIT}`);
  const direction = String(query.direction || PAGINATION_DIRECTION.NEXT);
  const cursorId = String(query.cursorId || "");
  const search = String(query.search ?? "").trim();
  const scopeWhere = query.scopeWhere ?? {};
  const statusCode = query.statusCode;
  const includeFinished = query.includeFinished;

  if (!VALID_DIRECTIONS.includes(direction)) {
    const error = new Error(
      `Invalid direction "${direction}". Expected "${PAGINATION_DIRECTION.NEXT}" or "${PAGINATION_DIRECTION.PREVIOUS}".`,
    );
    error.status = 400;
    throw error;
  }

  // The scope filter and the soft-delete filter are the base every other
  // condition narrows; counts are taken against the same base so they describe
  // what was returned rather than the whole table.
  const filter = { deleted_at: null, ...scopeWhere };

  if (statusCode) {
    filter.status = { code: statusCode };
  } else if (!includeFinished) {
    filter.status = { is_terminal: false };
  }

  const searchFilter = buildSearchFilter(search);
  if (searchFilter) Object.assign(filter, searchFilter);

  const paginatedFilter = { ...filter };
  let orderBy = { id: "asc" };

  if (cursorId) {
    if (direction === PAGINATION_DIRECTION.NEXT) {
      paginatedFilter.id = { gt: cursorId };
    } else if (direction === PAGINATION_DIRECTION.PREVIOUS) {
      paginatedFilter.id = { lt: cursorId };
      orderBy = { id: "desc" };
    }
  }

  const [initialCases, counts] = await Promise.all([
    prisma.case.findMany({
      where: paginatedFilter,
      orderBy,
      take: dataLimit + 1,
      include: caseListInclude,
    }),
    getCaseCounts(filter),
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
  // Same created_by / updated_by / deleted_by shape as every other case
  // endpoint.
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
