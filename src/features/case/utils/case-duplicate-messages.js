// File numbers are unique per branch, not globally: the same file number may
// be filed under two different branches, just not twice within the same one.
// Keyed by the field name so a P2002 can be mapped through
// getUniqueConstraintField, the same way banks do it.
//
// NOTE: case.prisma currently only has @@index([file_number, branch_id]), not
// @@unique, so this is enforced by the findCaseByFileNumber check alone and two
// concurrent creates can still slip a duplicate through. Promoting that index
// to @@unique would close the window; the P2002 handlers are already in place
// for when it is.
export const SCOPED_DUPLICATE_MESSAGES = {
  file_number: "Case with this file number already exists in this branch",
};
