// File numbers are unique per branch AND business type, not globally: the same
// number may be filed under national and retail, just not twice within one of
// them. Keyed by the field name so a P2002 can be mapped through
// getUniqueConstraintField, the same way banks do it.
//
// Enforced by @@unique([branch_id, business_type_id, file_number]) in
// case.prisma, so the findCaseByFileNumber pre-check is for the readable
// message and the constraint is what closes the concurrent-create window.
export const SCOPED_DUPLICATE_MESSAGES = {
  file_number:
    "Case with this file number already exists for this business type in this branch",
};
