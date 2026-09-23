// name, bank_branch_code and gst_number are each unique per branch (see
// @@unique in bank.prisma), so a P2002 on any of them means a duplicate
// within the same branch, not a global one. Keyed by the leading field of
// the composite unique index, which is what getUniqueConstraintField
// returns.
export const SCOPED_DUPLICATE_MESSAGES = {
  name: "Bank with this name already exists in this branch",
  bank_branch_code: "Bank with this branch code already exists in this branch",
  gst_number: "Bank with this GST number already exists in this branch",
};
