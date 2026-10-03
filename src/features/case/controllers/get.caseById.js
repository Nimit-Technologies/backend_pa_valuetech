import { getCaseById as getCaseByIdService } from "../services/service.getById.case.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { formatCaseResponse } from "../utils/case-history.js";

export const getCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isValidId = isValidCuid(id);

    if (!isValidId) {
      if (!looksLikeAnId(id)) {
        // Not even shaped like an id — most likely a mistyped/renamed
        // route falling through to :id. Let Express keep matching so
        // app.js's catch-all reports the real "Route not found".
        return next();
      }
      return res
        .status(404)
        .json({ success: false, message: "Id is not valid" });
    }

    // Resolved before the DB call: a non-super-admin only ever sees cases in
    // their own branch, so the branch filter is applied in the query itself
    // rather than fetched-then-checked.
    const scope = resolveBranchScope(req);
    const caseRecord = await getCaseByIdService(id, scope);

    if (!caseRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    res.json({ success: true, data: formatCaseResponse(caseRecord) });
  } catch (error) {
    console.error("getCaseById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch case" });
  }
};
