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
