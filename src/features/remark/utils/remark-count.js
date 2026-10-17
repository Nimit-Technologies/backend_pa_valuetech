import prisma from "../../../prisma/client.js";

// Remark counts for one thread.
//
// One count, not two: a remark has no is_active flag and no soft delete — there
// is no delete path at all (see remark.routes.js) — so "total" and "active"
// would always be the same number.
//
// Taken against the same filter the page was fetched with, so it describes what
// was returned rather than the whole table: a search narrows the count too. No
// cache, unlike getUserCounts — every count is scoped to one case, so a global
// cached total could never answer any of them, and `(case_id)` is indexed.
export const getRemarkCounts = async (where = {}) => {
  const total = await prisma.remark.count({ where });

  return { total };
};
