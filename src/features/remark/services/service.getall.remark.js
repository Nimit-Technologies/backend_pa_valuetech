import {
  DATA_LIMIT,
  PAGINATION_DIRECTION,
} from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";
import { remarkInclude, shapeRemark } from "./remark.service.helpers.js";
import { getRemarkCounts } from "../utils/remark-count.js";

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

// The author's name and employee id are snapshots on the remark row, so a
// thread can be searched by who wrote it without joining User — and the search
// keeps working for a remark whose author has since been renamed or offboarded.
const buildSearchFilter = (search) => {
  if (!search) return null;

  return {
    OR: [
      { content: { contains: search, mode: "insensitive" } },
      { first_name: { contains: search, mode: "insensitive" } },
      { employee_id: { contains: search, mode: "insensitive" } },
    ],
  };
};

// {{REMARK_BASE_URL}}/:caseId?direction=next&cursorId=""&search=""
//
// Remarks are always read for one case. The case id is required, not an
// optional filter: without it this returned every remark in the database to any
// authenticated caller.
//
// `branchId` scopes through the *case's* branch rather than Remark.branch_id —
// that column is a snapshot of the author's branch at the time of writing,
// which is a different thing and drifts if the author later moves.
//
// Page size is DATA_LIMIT, as on every other list; the client no longer sends
// `limit`. Paged on `id` like the user and case lists, which orders the thread
// chronologically for free: a cuid carries a timestamp prefix, so id order and
// created_at order agree.
export const getAllRemarks = async (params = {}) => {
  const caseId = params.caseId;
  const branchId = params.branchId;
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

  // The case filter is the base every other condition narrows; the count is
  // taken against it so it describes this thread, not the table.
  const filter = {
    case_id: caseId,
    ...(branchId && { case: { branch_id: branchId } }),
  };

  const searchFilter = buildSearchFilter(search);
  if (searchFilter) Object.assign(filter, searchFilter);

  const paginatedFilter = { ...filter };

  // Newest first, which is how a thread is read and how the remark preview on
  // the case detail is ordered. That inverts the comparisons against the user
  // list: walking "next" here means walking to *older* remarks, so the cursor
  // takes ids below the last one on the page.
  let orderBy = { id: "desc" };

  if (cursorId) {
    if (direction === PAGINATION_DIRECTION.NEXT) {
      paginatedFilter.id = { lt: cursorId };
    } else if (direction === PAGINATION_DIRECTION.PREVIOUS) {
      paginatedFilter.id = { gt: cursorId };
      orderBy = { id: "asc" };
    }
  }

  const [initialRemarks, counts] = await Promise.all([
    prisma.remark.findMany({
      where: paginatedFilter,
      orderBy,
      take: DATA_LIMIT + 1,
      include: remarkInclude,
    }),
    getRemarkCounts(filter),
  ]);

  const totalCount = counts.total;

  if (!initialRemarks.length) {
    return {
      remarks: [],
      remarkFirstId: null,
      remarkLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      remarkLength: 0,
      totalCount,
      dataLimit: DATA_LIMIT,
    };
  }

  // One row over the limit was fetched to answer "is there another page?"; it
  // is dropped rather than returned, so the client never sees a page longer
  // than DATA_LIMIT.
  const hasMore = initialRemarks.length > DATA_LIMIT;

  if (hasMore) initialRemarks.pop();
  // A backward page was read in ascending order to walk away from the cursor;
  // flip it so every page comes back newest-first.
  const orderedRemarks =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialRemarks.reverse()
      : initialRemarks;
  // Same `is_edited` shape as every other remark endpoint.
  const finalRemarks = orderedRemarks.map(shapeRemark);

  return {
    remarks: finalRemarks,
    remarkFirstId: finalRemarks[0]?.id,
    remarkLastId: finalRemarks[finalRemarks.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,
    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,
    remarkLength: finalRemarks.length,
    totalCount,
    dataLimit: DATA_LIMIT,
  };
};
