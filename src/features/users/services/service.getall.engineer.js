import {
  DATA_LIMIT,
  PAGINATION_DIRECTION,
} from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";
import {
  ENGINEER_ROLE_NAME,
  TECHNICAL_DEPARTMENT_NAME,
} from "../../../constant/user-directory.js";

// Exactly the five fields the picker shows. Everything else is left out on
// purpose, and one omission is load-bearing: aadhaar_number is stored
// encrypted, and this list is sent as selected rather than through
// formatUserResponse (see the controller), so adding it here would put
// ciphertext on the wire. Add the formatter back in the same change if it ever
// has to carry one.
//
// Whatever is added here is readable by every authenticated session, including
// every engineer in the branch.
const ENGINEER_SELECT = {
  id: true,
  employee_id: true,
  first_name: true,
  last_name: true,
  phone: true,
};

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

// The predicate that defines "an assignable engineer", shared by the page
// query and the counts so the two can never describe different sets.
const buildEngineerFilter = ({ branchId, searchFilter }) => {
  const filter = {
    deleted_at: null,
    // Inactive engineers are excluded rather than flagged: PATCH
    // /case/assign/:id refuses an inactive or deleted employee with a 409
    // (respondIfInvalidParent), so listing one would offer a choice that
    // cannot be made.
    is_active: true,
    // Both halves are required. A Role row carries its own department_id, so
    // "engineer" already implies the technical department by design — but a
    // user's department_id is a separate column and nothing in user creation
    // forces the two to agree, so the department is matched on the user rather
    // than inferred from their role.
    //
    // Matched case-insensitively because these names are admin-entered free
    // text. That cannot use the plain btree index on `name`, which costs
    // nothing here: both tables hold a handful of rows per branch.
    role: { name: { equals: ENGINEER_ROLE_NAME, mode: "insensitive" } },
    department: {
      name: { equals: TECHNICAL_DEPARTMENT_NAME, mode: "insensitive" },
    },
  };

  if (branchId) filter.branch_id = branchId;

  if (searchFilter) {
    // Only the fields this endpoint returns are searchable — matching on an
    // email it never sends would make a row appear for no visible reason.
    filter.OR = [
      { first_name: searchFilter },
      { last_name: searchFilter },
      { employee_id: searchFilter },
      { phone: searchFilter },
    ];
  }

  return filter;
};

// {{USER_BASE_URL}}/all-engineer?direction=next&cursorId=""&search=""&branch=""
//
// Cursor-paginated on id, like /all-user: same envelope, same page size, so the
// client's existing pagination controls work unchanged.
//
// `branchId` omitted means every branch, which only a super admin can ask for
// — the controller resolves that.
export const getAllEngineers = async (params = {}) => {
  const direction = String(params.direction || PAGINATION_DIRECTION.NEXT);
  const cursorId = String(params.cursorId || "");
  const search = String(params.search ?? "").trim();
  const branchId = params.branchId;

  if (!VALID_DIRECTIONS.includes(direction)) {
    const error = new Error(
      `Invalid direction "${direction}". Expected "${PAGINATION_DIRECTION.NEXT}" or "${PAGINATION_DIRECTION.PREVIOUS}".`,
    );
    error.status = 400;
    throw error;
  }

  const searchFilter = search
    ? { contains: search, mode: "insensitive" }
    : undefined;

  // Without the cursor: this is the set being paged through, and what the
  // counts below report on.
  const baseFilter = buildEngineerFilter({ branchId, searchFilter });

  const filter = { ...baseFilter };
  let orderBy = { id: "asc" };

  if (cursorId) {
    if (direction === PAGINATION_DIRECTION.NEXT) {
      filter.id = { gt: cursorId };
    } else if (direction === PAGINATION_DIRECTION.PREVIOUS) {
      filter.id = { lt: cursorId };
      orderBy = { id: "desc" };
    }
  }

  const [initialEngineers, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: filter,
      orderBy,
      take: DATA_LIMIT + 1,
      select: ENGINEER_SELECT,
    }),
    // Scoped to the same filter as the list, as the status list does, so the
    // number describes what is being paged rather than the whole table. There
    // is no cached *-count.js layer for this one: unlike the user list it is
    // always filtered by role and department, so a global cache could never
    // answer it.
    prisma.user.count({ where: baseFilter }),
  ]);

  // The list is active-only by construction, so these two are necessarily
  // equal. Both are returned because the client reads the same envelope here
  // as it does from /all-user.
  const totalActiveCount = totalCount;

  if (!initialEngineers.length) {
    return {
      engineers: [],
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

  const hasMore = initialEngineers.length > DATA_LIMIT;

  if (hasMore) initialEngineers.pop();
  const orderedEngineers =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialEngineers.reverse()
      : initialEngineers;

  return {
    engineers: orderedEngineers,
    userFirstId: orderedEngineers[0]?.id,
    userLastId: orderedEngineers[orderedEngineers.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,
    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,
    userLength: orderedEngineers.length,
    totalCount,
    totalActiveCount,
    dataLimit: DATA_LIMIT,
  };
};
