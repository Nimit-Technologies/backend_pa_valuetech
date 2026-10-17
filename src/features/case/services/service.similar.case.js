import prisma from "../../../prisma/client.js";
import { CREDENTIALS } from "../../../constant/credentials.js";
import { resolvePageSize, shapeSimilarCase } from "../utils/case-similarity.js";

// Cases that may already be the one the user is about to create: same customer
// phone number, or an address that reads like the same property.
//
// Read-only. Nothing here creates, updates or deletes.
//
// Why raw SQL rather than the Prisma query API: similarity() and the `%`
// operator have no Prisma equivalent, and ranking by match quality cannot be
// expressed in a Prisma `orderBy`. Every value is still a bound parameter —
// there is no string concatenation of user input anywhere below.
//
// This is a deliberate, reviewed exception to the "no raw SQL on tenant
// tables" rule (CLAUDE.md §4.6). That rule exists because raw SQL can slip
// past row scoping; here the scoping is in the WHERE clause below and fails
// closed — a caller with no branch resolves to a sentinel that matches no row
// (see resolveCaseScope), and `c.deleted_at IS NULL` keeps soft deletes out.
// Do not "fix" this by moving it to the query API: similarity() would have to
// become `similarity(a, b) >= threshold`, which ignores the GIN index and
// degrades to a sequential scan computing a similarity for every row.
//
// The two statements run in one interactive transaction because they must land
// on the same pooled connection: set_limit() configures the threshold that the
// `%` operator in the second statement reads.
export const findSimilarCases = async ({
  customerContactNumber,
  address,
  branchId = null,
  excludeCaseId = null,
  offset = 0,
}) => {
  const pageSize = resolvePageSize();
  const threshold = CREDENTIALS.ADDRESS_SIMILARITY_THRESHOLD;

  const { lane, landmark, city, district, state, pin_code, country } = address;

  const result = await prisma.$transaction(async (tx) => {
    // Both halves of one round trip. set_limit() is how the configured
    // threshold reaches the `%` operator: writing `similarity(a, b) >= threshold` in
    // the query instead would read the same but ignore the GIN index and
    // degrade to a sequential scan computing a similarity per row.
    //
    // case_address_search_text() is the same function the addresses trigger
    // uses, so the string being searched for is built by exactly the code that
    // built the strings being searched. Normalizing the input in JavaScript
    // instead would be a second definition, free to drift from the stored one.
    const [prepared] = await tx.$queryRaw`
      SELECT set_limit(${threshold}::real) AS threshold,
             case_address_search_text(
               ${lane ?? null}::text,
               ${landmark ?? null}::text,
               ${city}::text,
               ${district}::text,
               ${state}::text,
               ${pin_code}::text,
               ${country}::text
             ) AS search_text
    `;

    const addressSearchText = prepared?.search_text ?? "";

    // One SELECT rather than a UNION of the two conditions, which is what makes
    // "matches both, returned once" fall out for free.
    //
    // The address parameter arrives as plain text, already normalized by the
    // statement above. Passing it as a parameter rather than wrapping the
    // function call in a CTE matters: a CTE output column on the right-hand
    // side of `%` can read as non-constant to the planner, which then skips the
    // GIN index.
    //
    // LIMIT caps what is returned, not what is considered: the whole eligible
    // set is matched and ranked in the database, and only the page crosses the
    // wire. business_type_name comes from the join, so there is no second query
    // per row.
    //
    // c.id is the last ORDER BY term purely to break ties deterministically —
    // without it a row could appear on two consecutive pages, or on neither.
    const rows = await tx.$queryRaw`
      SELECT c.id,
             c.file_number,
             bt.name AS business_type_name,
             (c.customer_contact_number = ${customerContactNumber}) AS phone_match,
             similarity(a.search_text, ${addressSearchText}::text) AS address_similarity
      FROM "cases" c
      JOIN "addresses" a ON a.id = c.address_id
      JOIN "business_types" bt ON bt.id = c.business_type_id
      WHERE c.deleted_at IS NULL
        AND (${branchId}::text IS NULL OR c.branch_id = ${branchId}::text)
        AND (${excludeCaseId}::text IS NULL OR c.id <> ${excludeCaseId}::text)
        AND (
          c.customer_contact_number = ${customerContactNumber}
          OR a.search_text % ${addressSearchText}::text
        )
      ORDER BY phone_match DESC,
               address_similarity DESC NULLS LAST,
               c.id ASC
      LIMIT ${pageSize + 1} OFFSET ${offset}
    `;

    return rows;
  });

  // One row over the page is fetched so a full page is distinguishable from the
  // end of the matches — the same trick getAllCases uses.
  const hasNextPage = result.length > pageSize;
  if (hasNextPage) result.pop();

  return {
    similar_cases: result.map(shapeSimilarCase),
    caseLength: result.length,
    dataLimit: pageSize,
    hasNextPage,
    nextOffset: hasNextPage ? offset + pageSize : null,
  };
};
