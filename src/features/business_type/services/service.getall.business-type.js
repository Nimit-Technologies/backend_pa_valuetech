import prisma from "../../../prisma/client.js";
import { CREDENTIALS } from "../../../constant/credentials.js";
import { PAGINATION_DIRECTION } from "../../../constant/pagination.js";

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

export const getAllBusinessTypes = async (query) => {
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

  const initialBusinessTypes = await prisma.businessType.findMany({
    where: filter,
    orderBy,
    take: dataLimit + 1,
  });

  if (!initialBusinessTypes.length) {
    return {
      businessTypes: [],
      businessTypeFirstId: null,
      businessTypeLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      businessTypeLength: 0,
      dataLimit,
    };
  }

  const hasMore = initialBusinessTypes.length > dataLimit;
  if (hasMore) initialBusinessTypes.pop();

  const finalBusinessTypes =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialBusinessTypes.reverse()
      : initialBusinessTypes;

  return {
    businessTypes: finalBusinessTypes,
    businessTypeFirstId: finalBusinessTypes[0]?.id,
    businessTypeLastId: finalBusinessTypes[finalBusinessTypes.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,
    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,
    businessTypeLength: finalBusinessTypes.length,
    dataLimit,
  };
};
