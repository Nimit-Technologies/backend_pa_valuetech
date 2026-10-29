// Re-exported so every existing `import { formatDateTime } from "<this file>"`
// keeps working; the implementation (and its Asia/Kolkata handling) lives in
// one place now.
export { formatDateTime } from "../../../utils/format-date-time.js";
import { formatDateTime } from "../../../utils/format-date-time.js";

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
