// name is unique per branch (see @@unique in business_type.prisma), so a
// P2002 on it means a duplicate within the same branch, not a global one.
// Keyed by the leading field of the composite unique index, which is what
// getUniqueConstraintField returns.
export const SCOPED_DUPLICATE_MESSAGES = {
  name: "Business type with this name already exists in this branch",
};
