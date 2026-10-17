import {
  DEFAULT_DATA_LIMIT,
  resolveDataLimit,
} from "../../../constant/pagination.js";

// Page size for the similar-case search. The client never asks for one: the
// form is not where paging policy belongs, and a client-chosen limit is one
// more thing to validate on every request. DATA_LIMIT governs, exactly as it
// does for the case list, and "Load more" walks forward with `offset`.
export const DEFAULT_PAGE_SIZE = DEFAULT_DATA_LIMIT;

// A ceiling on what DATA_LIMIT may ask for here. This search is run while a
// form is being filled, so a misconfigured env should not turn every keystroke
// into a 500-row ranked query.
export const MAX_PAGE_SIZE = 50;

// Offset paging gets linearly more expensive with depth, and nobody reviewing
// possible duplicates scrolls past a few hundred. Past this the answer is a
// narrower address, not another page.
export const MAX_OFFSET = 500;

// resolveDataLimit() owns the parse and the fallback, so the only thing left
// here is this search's own ceiling. Called per request rather than bound to
// the shared DATA_LIMIT constant, since the clamp makes this a different value
// from the one the lists page with.
export const resolvePageSize = () =>
  Math.min(resolveDataLimit(), MAX_PAGE_SIZE);

// Stored numbers are exactly 10 digits — the zod schema enforces that on every
// write path — so the only work here is making the *input* forgiving. A user
// pasting "+91 75369-87402" from a WhatsApp message means the same customer as
// one typing "7536987402", and an exact-match search that disagrees is just a
// silent miss.
//
// The last 10 digits rather than the first: that is what drops a country code
// without having to enumerate which country codes exist.
export const normalizePhone = (value) => {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const digits = `${value}`.replace(/\D/g, "");
  if (digits.length < 10) return null;

  return digits.slice(-10);
};

// Only the three fields the contract names. `phone_match` and
// `address_similarity` come back from the query because the ranking needs them,
// and are dropped here rather than in SQL so the ORDER BY stays readable.
//
// `id` is the case's own primary key. Spelled out because it is the one field
// the spec explicitly warns about: a client that received a business type id
// here would link to the wrong record entirely.
export const shapeSimilarCase = (row) => ({
  id: row.id,
  file_number: row.file_number,
  business_type_name: row.business_type_name,
});
