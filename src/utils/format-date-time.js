/**
 * The one place a timestamp becomes the "YYYY-MM-DD HH:mm:ss" string that goes
 * into history entries and formatted responses.
 *
 * This used to be copied into seven feature folders, each reading the server's
 * clock through the local-time getters (getHours, getDate, …) and emitting a
 * string with no timezone marker — so the reader had no way to know which zone
 * it meant. Development never showed the problem, because the dev machine and
 * the dev server are both IST. The production container runs UTC, which made
 * every one of these timestamps render 5h30m behind the event it described.
 *
 * Formatting explicitly in Asia/Kolkata means these strings are IST wherever
 * the process happens to run, so the container's TZ can no longer silently
 * change what the API reports. TZ is pinned to Asia/Kolkata as well, so the
 * two agree rather than one quietly compensating for the other.
 *
 * The output shape is unchanged, so stored history entries and the frontend
 * parser (fronted_pa_valuetech/src/constants/formatDate.js, which reads these
 * as IST) both keep working.
 */

const IST_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  // hourCycle rather than hour12: false — the latter still renders midnight as
  // "24" instead of "00" under some ICU versions.
  hourCycle: "h23",
});

export const IST_TIME_ZONE = "Asia/Kolkata";

export const formatDateTime = (date = new Date()) => {
  if (!date) return null;

  const instant = new Date(date);
  if (Number.isNaN(instant.getTime())) return null;

  const parts = {};
  for (const { type, value } of IST_FORMATTER.formatToParts(instant)) {
    parts[type] = value;
  }

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

export default formatDateTime;
