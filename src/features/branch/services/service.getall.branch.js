import { CREDENTIALS } from "../../../constant/credentials.js";
import { PAGINATION_DIRECTION } from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

export const getAllBranches = async (query) => {
  const dataLimit = parseInt(`${CREDENTIALS.DATA_LIMIT}`);
  const direction = String(query.direction || PAGINATION_DIRECTION.NEXT);
  const cursorId = String(query.cursorId || "");

  if (!VALID_DIRECTIONS.includes(direction)) {
    const error = new Error(
      `Invalid direction "${direction}". Expected "${PAGINATION_DIRECTION.NEXT}" or "${PAGINATION_DIRECTION.PREVIOUS}".`,
    );
    error.status = 400;
    throw error;
  }

  const filter = { deleted_at: null };
  let orderBy = { id: "asc" };

  if (cursorId) {
    if (direction === PAGINATION_DIRECTION.NEXT) {
      filter.id = { gt: cursorId };
    } else if (direction === PAGINATION_DIRECTION.PREVIOUS) {
      filter.id = { lt: cursorId };
      orderBy = { id: "desc" };
    }
  }

  const initialBranches = await prisma.branch.findMany({
    where: filter,
    orderBy,
    take: dataLimit + 1,
  });

  if (!initialBranches.length) {
    return {
      branches: [],
      branchFirstId: null,
      branchLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      branchLength: 0,
      dataLimit,
    };
  }

  const hasMore = initialBranches.length > dataLimit;

  if (hasMore) initialBranches.pop();

  const finalBranches =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialBranches.reverse()
      : initialBranches;

  return {
    branches: finalBranches,
    branchFirstId: finalBranches[0]?.id,
    branchLastId: finalBranches[finalBranches.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,

    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,

    branchLength: finalBranches.length,
    dataLimit,
  };
};
