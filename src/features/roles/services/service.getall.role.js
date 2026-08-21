import { CREDENTIALS } from "../../../constant/credentials.js";
import { PAGINATION_DIRECTION } from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";
import { departmentSelect, shapeRole } from "./role.service.helpers.js";

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

export const getAllRoles = async (query) => {
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

  const initialRoles = await prisma.role.findMany({
    where: filter,
    orderBy,
    take: dataLimit + 1,
    include: { department: departmentSelect },
  });

  if (!initialRoles.length) {
    return {
      roles: [],
      roleFirstId: null,
      roleLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      roleLength: 0,
      dataLimit,
    };
  }

  const hasMore = initialRoles.length > dataLimit;

  if (hasMore) initialRoles.pop();
  const orderedRoles =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialRoles.reverse()
      : initialRoles;
  // Same flattened { department, branch } shape as every other roles
  // endpoint (create/update/getById/restore/status/softDelete) — without
  // this the list response nested branch under department instead.
  const finalRoles = orderedRoles.map(shapeRole);

  return {
    roles: finalRoles,
    roleFirstId: finalRoles[0]?.id,
    roleLastId: finalRoles[finalRoles.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,

    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,
    roleLength: finalRoles.length,
    dataLimit,
  };
};
