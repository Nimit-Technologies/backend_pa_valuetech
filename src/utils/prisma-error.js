/**
 * Extracts the offending field/column name from a Prisma P2002 (unique constraint) error.
 *
 * With the pg driver adapter, Postgres only reports the constraint *name*
 * (e.g. "users_phone_key"), not the column list, so the field is parsed out
 * of Prisma's default `<table>_<column>_key` naming convention. Older/other
 * engines may still populate `error.meta.target` directly, so that shape is
 * checked first for compatibility.
 */
export const getUniqueConstraintField = (error) => {
  const target = error?.meta?.target;
  if (Array.isArray(target)) return target[0];
  if (typeof target === "string") return target;

  const constraint = error?.meta?.driverAdapterError?.cause?.constraint;
  if (constraint?.fields?.length) return constraint.fields[0];
  if (constraint?.index) {
    const match = constraint.index.match(/^[^_]+_(.+)_key$/);
    return match ? match[1] : constraint.index;
  }

  return undefined;
};
