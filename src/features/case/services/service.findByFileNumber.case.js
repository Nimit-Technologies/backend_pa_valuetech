import prisma from "../../../prisma/client.js";

// File numbers are unique per branch AND business type, not globally: the same
// number may be filed under national and retail, just not twice within one of
// them. Scoping it this way also means a coordinator can never be blocked by a
// case outside their own business type — which they cannot see, and so could
// neither find nor resolve.
//
// Soft-deleted and cancelled cases are deliberately NOT excluded. A file number
// stays taken while the case still physically exists, so restoring one can
// never collide with a newer case that reused the number.
//
// file_number is normalized to upper case by the zod schema, so this exact
// match is equivalent to the case-insensitive comparison it replaces — and it
// matches what the composite @@unique enforces, which a `mode: "insensitive"`
// lookup would not.
export const findCaseByFileNumber = (
  file_number,
  branch_id,
  business_type_id,
) => {
  // findFirst with the three fields flat rather than findUnique on the
  // composite key: the @@unique still guarantees at most one match, and a
  // filter-based lookup is what any future branch-scoping Prisma extension can
  // extend — findUnique silently ignores injected filters.
  return prisma.case.findFirst({
    where: { branch_id, business_type_id, file_number },
    select: { id: true, file_number: true, deleted_at: true },
  });
};
