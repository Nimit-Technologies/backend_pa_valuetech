import { CREDENTIALS } from "../../../constant/credentials.js";
import { PAGINATION_DIRECTION } from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";
import { getUserCounts } from "../utils/user-count.js";

const relationSelect = { select: { id: true, name: true } };

const USER_LIST_SELECT = {
  id: true,
  employee_id: true,
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
  aadhaar_number: true,
  is_active: true,
  branch: relationSelect,
  department: relationSelect,
  role: relationSelect,
  address: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
};

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

const DEFAULT_DATA_LIMIT = 10;
const parsedDataLimit = parseInt(CREDENTIALS.DATA_LIMIT, 10);
const DATA_LIMIT =
  Number.isInteger(parsedDataLimit) && parsedDataLimit > 0
    ? parsedDataLimit
    : DEFAULT_DATA_LIMIT;

const getSearchUserCounts = async (nameFilter) => {
  const groups = await prisma.user.groupBy({
    by: ["is_active"],
    where: {
      deleted_at: null,
      OR: [
        { first_name: nameFilter },
        { last_name: nameFilter },
        { employee_id: nameFilter },
        { email: nameFilter },
      ],
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

// {{USER_BASE_URL}}/all-user?direction=next&cursorId=""&search=""
export const getAllUsers = async (params = {}) => {
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

  let searchNameFilter;
  if (search) {
    searchNameFilter = { contains: search, mode: "insensitive" };
    filter.OR = [
      { first_name: searchNameFilter },
      { last_name: searchNameFilter },
      { employee_id: searchNameFilter },
      { email: searchNameFilter },
    ];
  }

  const [initialUsers, counts] = await Promise.all([
    prisma.user.findMany({
      where: filter,
      orderBy,
      take: DATA_LIMIT + 1,
      select: USER_LIST_SELECT,
    }),
    search ? getSearchUserCounts(searchNameFilter) : getUserCounts(),
  ]);

  const totalCount = counts.total;
  const totalActiveCount = counts.active;

  if (!initialUsers.length) {
    return {
      users: [],
      userFirstId: null,
      userLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      userLength: 0,
      totalCount,
      totalActiveCount,
      dataLimit: DATA_LIMIT,
    };
  }

  const hasMore = initialUsers.length > DATA_LIMIT;

  if (hasMore) initialUsers.pop();
  const orderedUsers =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialUsers.reverse()
      : initialUsers;

  return {
    users: orderedUsers,
    userFirstId: orderedUsers[0]?.id,
    userLastId: orderedUsers[orderedUsers.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,
    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,
    userLength: orderedUsers.length,
    totalCount,
    totalActiveCount,
    dataLimit: DATA_LIMIT,
  };
};
