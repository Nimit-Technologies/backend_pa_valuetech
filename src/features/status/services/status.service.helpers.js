// Status has no relations worth returning (its only back-relations are
// Case[] and Allocation[], which would be unbounded), so every service selects
// the same flat column list.
export const statusSelect = {
  id: true,
  code: true,
  name: true,
  is_active: true,
  is_terminal: true,
  sort_order: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
};

// sort_order is the column's whole purpose — it drives the order statuses are
// shown in. created_at breaks ties, since sort_order is not unique and
// defaults to 0 for every row that omits it.
export const STATUS_ORDER_BY = [{ sort_order: "asc" }, { created_at: "asc" }];
