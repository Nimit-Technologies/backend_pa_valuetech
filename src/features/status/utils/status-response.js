/**
 * Helper to format date to YYYY-MM-DD HH:mm:ss
 */
const pad = (n) => String(n).padStart(2, "0");

export const formatDateTime = (date = new Date()) => {
  if (!date) return null;
  const dObj = new Date(date);
  if (isNaN(dObj.getTime())) return null;
  const d = `${dObj.getFullYear()}-${pad(dObj.getMonth() + 1)}-${pad(dObj.getDate())}`;
  const t = `${pad(dObj.getHours())}:${pad(dObj.getMinutes())}:${pad(dObj.getSeconds())}`;
  return `${d} ${t}`;
};

// Like Case, Status carries no `history` Json column, so there is no history
// entry to build here — only the response shape.
//
// `is_deleted` is always present so a super admin can tell which rows are
// restorable without reading the raw deleted_at, which is stripped outside
// development along with the other timestamps.
export const formatStatusResponse = (data) => {
  if (!data) return data;

  const isDev = process.env.NODE_ENV === "development";

  const formatSingle = (status) => {
    if (!status || typeof status !== "object") return status;

    const { created_at, updated_at, deleted_at, ...rest } = status;

    const base = { ...rest, is_deleted: Boolean(deleted_at) };

    if (isDev) {
      return {
        ...base,
        created_at: formatDateTime(created_at),
        updated_at: formatDateTime(updated_at),
        deleted_at: formatDateTime(deleted_at),
      };
    }

    return base;
  };

  if (Array.isArray(data)) {
    return data.map(formatSingle);
  }

  return formatSingle(data);
};
