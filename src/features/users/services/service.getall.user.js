import { CREDENTIALS } from "../../../constant/credentials.js";
import { PAGINATION_DIRECTION } from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";

const relationSelect = { select: { id: true, name: true } };
const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

export const getAllUsers = async (query) => {
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

  const initialUsers = await prisma.user.findMany({
    where: filter,
    orderBy,
    take: dataLimit + 1,
    omit: { password: true },
    include: {
      branch: relationSelect,
      department: relationSelect,
      role: relationSelect,
    },
  });

  if (!initialUsers.length) {
    return {
      users: [],
      userFirstId: null,
      userLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      userLength: 0,
      dataLimit,
    };
  }

  const hasMore = initialUsers.length > dataLimit;
  if (hasMore) initialUsers.pop();

  const finalUsers =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialUsers.reverse()
      : initialUsers;

  return {
    users: finalUsers,
    userFirstId: finalUsers[0]?.id,
    userLastId: finalUsers[finalUsers.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,
    
    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,
    userLength: finalUsers.length,
    dataLimit,
  };
};
