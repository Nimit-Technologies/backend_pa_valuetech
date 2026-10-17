import { findSimilarCases } from "../services/service.similar.case.js";
import { similarCaseSchema } from "../case.schema.js";
import { resolveCaseScope } from "../../../utils/case-scope.js";

// Postgres raises these when case_address_search_text() or addresses.search_text
// is absent, which means this migration has not been applied rather than that
// the client sent something wrong — the same distinction create.case.js draws
// for the unseeded case statuses.
const MISSING_SCHEMA_CODES = new Set(["42883", "42703", "42P01"]);

const missingSchemaCode = (error) =>
  MISSING_SCHEMA_CODES.has(error?.meta?.code) ||
  MISSING_SCHEMA_CODES.has(error?.code);

// POST /case/similar — advisory, read-only. Called while a create form is being
// filled, so the user sees a property already on file before submitting a second
// case for it.
export const getSimilarCases = async (req, res) => {
  try {
    const parsed = similarCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    // isAuthenticated already guarantees this. Checked anyway because the
    // failure mode without it is a branch filter of `null` — an unscoped search
    // — rather than an error, and a 401 is a clearer answer than silence.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    const { customer_contact_number, address, case_id, offset } = parsed.data;

    // Branch-wide on purpose, and only on this endpoint. resolveCaseScope would
    // also pin a coordinator to their own business type, but the duplicate most
    // worth catching is the same property already filed under a different
    // business line — the one they cannot see. Widening it costs nothing: the
    // response carries id, file_number and business type name, all of which a
    // branch admin can already read, and the route is closed to engineers.
    //
    // A caller with no branch resolves to the NO_SCOPE sentinel and matches
    // nothing, so this fails closed.
    const scope = resolveCaseScope(req);
    const branchId = scope.where.branch_id ?? null;

    const { similar_cases, caseLength, dataLimit, hasNextPage, nextOffset } =
      await findSimilarCases({
        customerContactNumber: customer_contact_number,
        address,
        branchId,
        excludeCaseId: case_id ?? null,
        offset,
      });

    // similar_cases sits at the top level, alongside the paging fields, the way
    // getAllCases returns its own. No match is an empty array and a 200, not a
    // 404: "nothing resembles this" is a successful answer to the question.
    res.json({
      success: true,
      similar_cases,
      caseLength,
      dataLimit,
      hasNextPage,
      nextOffset,
    });
  } catch (error) {
    if (missingSchemaCode(error)) {
      console.error(
        "getSimilarCases error: address search column or function is missing — run `npm run migrate`",
        error,
      );
      return res.status(500).json({
        success: false,
        message:
          "Similar-case search is not configured. Contact your administrator.",
      });
    }

    console.error("getSimilarCases error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to search similar cases" });
  }
};
