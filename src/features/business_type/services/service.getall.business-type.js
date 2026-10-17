import prisma from "../../../prisma/client.js";
import {
  DATA_LIMIT,
  PAGINATION_DIRECTION,
} from "../../../constant/pagination.js";
import { branchSelect } from "./business-type.service.helpers.js";

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

export const getAllBusinessTypes = async (query) => {
  const direction = String(query.direction || PAGINATION_DIRECTION.NEXT);
  const cursorId = String(query.cursorId || "");

  if (!VALID_DIRECTIONS.includes(direction)) {
    const error = new Error(
      `Invalid direction "${direction}". Expected "${PAGINATION_DIRECTION.NEXT}" or "${PAGINATION_DIRECTION.PREVIOUS}".`,
    );
    error.status = 400;
    throw error;
  }

  // Soft-deleted business types stay in the list, as they do for departments
  // and banks: the row is what carries the Restore action, so filtering them
  // out here is what made restore unreachable from the UI. The client derives
  // `isDeleted` from `deleted_at` (see normalizeBusiness) — this endpoint
  // returns raw rows, so no serializer change is needed.
  //
  // Note: unlike bank and department this endpoint sends no totals, so the
  // "Total Businesses" card falls back to the loaded page length and now
  // counts deleted rows along with the rest.
  const filter = {};
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

  const initialBusinessTypes = await prisma.businessType.findMany({
    where: filter,
    orderBy,
    take: DATA_LIMIT + 1,
    include: { branch: branchSelect },
  });

  if (!initialBusinessTypes.length) {
    return {
      businessTypes: [],
      businessTypeFirstId: null,
      businessTypeLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      businessTypeLength: 0,
      dataLimit: DATA_LIMIT,
    };
  }

  const hasMore = initialBusinessTypes.length > DATA_LIMIT;
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
    dataLimit: DATA_LIMIT,
  };
};
