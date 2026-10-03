import { getCaseById } from "../services/service.getById.case.js";
import { setCaseStatus } from "../services/service.updateStatus.case.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createCaseIdentitySnapshot,
  formatCaseResponse,
} from "../utils/case-history.js";

export const updateCaseStatus = async (req, res, next) => {
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

    // The status flip is recorded as an update-history row, which needs an
    // identifiable actor to attribute it to.
    const actor = createCaseIdentitySnapshot(req.user);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    // Resolved before the DB call so a branch-scoped caller's branch_id is
    // filtered in the query itself, instead of fetching the case first and
    // discarding it after if it belongs to another branch.
    const scope = resolveBranchScope(req);
    const existing = await getCaseById(id, scope);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Case is soft-deleted; restore it before changing status",
      });
    }

    const is_active = !existing.is_active;
    const caseRecord = await setCaseStatus(id, is_active, actor, existing);

    logAuthEvent(is_active ? "case_activated" : "case_deactivated", {
      case_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: `Case ${is_active ? "activated" : "deactivated"} successfully`,
      data: formatCaseResponse(caseRecord),
    });
  } catch (error) {
    console.error("updateCaseStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update case status" });
  }
};
