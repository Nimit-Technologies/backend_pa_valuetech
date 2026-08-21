import { CREDENTIALS } from "../../../constant/credentials.js";
import { PAGINATION_DIRECTION } from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

export const getAllBanks = async (query) => {
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
  if (query.branchId) filter.branch_id = query.branchId;
  let orderBy = { id: "asc" };

  if (cursorId) {
    if (direction === PAGINATION_DIRECTION.NEXT) {
      filter.id = { gt: cursorId };
    } else if (direction === PAGINATION_DIRECTION.PREVIOUS) {
      filter.id = { lt: cursorId };
      orderBy = { id: "desc" };
    }
  }

  const initialBanks = await prisma.bank.findMany({
    where: filter,
    orderBy,
    take: dataLimit + 1,
  });

  if (!initialBanks.length) {
    return {
      banks: [],
      bankFirstId: null,
      bankLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      bankLength: 0,
      dataLimit,
    };
  }

  const hasMore = initialBanks.length > dataLimit;

  if (hasMore) initialBanks.pop();

  const finalBanks =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialBanks.reverse()
      : initialBanks;
  return {
    banks: finalBanks,
    bankFirstId: finalBanks[0]?.id,
    bankLastId: finalBanks[finalBanks.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,

    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,
    bankLength: finalBanks.length,
    dataLimit,
  };
};
