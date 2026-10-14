import prisma from "../../../prisma/client.js";
import { statusSelect, STATUS_ORDER_BY } from "./status.service.helpers.js";

// Unlike the branch-scoped lists, this one is not cursor-paginated. Statuses
// are a small global lookup table whose rows are ordered by sort_order, and
// every role reads the whole list to populate workflow dropdowns; paginating
// by id would scramble that order for no benefit. Counts are read straight
// from the DB for the same reason — the table is too small to justify the
// cached *-count.js layer the branch/bank/role lists use.
const getStatusCounts = async (where) => {
  const groups = await prisma.status.groupBy({
    by: ["is_active"],
    where,
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

export const getAllStatuses = async (params = {}) => {
  const search = String(params.search ?? "").trim();

  // Soft-deleted rows are hidden by default. A super admin passes
  // include_deleted to find the rows that /restore/:id can act on; without it
  // a soft-deleted status would be invisible and unrestorable.
  const filter = params.includeDeleted ? {} : { deleted_at: null };
  if (search) {
    filter.name = { contains: search, mode: "insensitive" };
  }

  const [statuses, counts] = await Promise.all([
    prisma.status.findMany({
      where: filter,
      orderBy: STATUS_ORDER_BY,
      select: statusSelect,
    }),
    getStatusCounts(filter),
  ]);

  return {
    statuses,
    statusLength: statuses.length,
    // Scoped to the same filter as the list, so they describe what was
    // returned rather than the whole table.
    totalCount: counts.total,
    totalActiveCount: counts.active,
  };
};
