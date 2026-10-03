import { getCaseById } from "../services/service.getById.case.js";
import { softDeleteCase as softDeleteCaseService } from "../services/service.softDelete.case.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createCaseIdentitySnapshot,
  formatCaseResponse,
} from "../utils/case-history.js";

export const softDeleteCase = async (req, res, next) => {
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

    // deleted_by_id and the deleted_by_* snapshot are written together, so the
    // delete has to be attributable to an identifiable actor.
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
      return res
        .status(409)
        .json({ success: false, message: "Case is already deleted" });
    }

    const caseRecord = await softDeleteCaseService(id, actor, existing);

    logAuthEvent("case_soft_deleted", {
      case_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Case soft-deleted successfully",
      data: formatCaseResponse(caseRecord),
    });
  } catch (error) {
    console.error("softDeleteCase error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to soft-delete case" });
  }
};
