import { getCaseById } from "../services/service.getById.case.js";
import { softDeleteCase as softDeleteCaseService } from "../services/service.softDelete.case.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { resolveCaseScope } from "../../../utils/case-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createCaseIdentitySnapshot,
  formatCaseResponse,
} from "../utils/case-history.js";

export const softDeleteCase = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    // deleted_by_id and the deleted_by_* snapshot are written together, so the
    // delete has to be attributable to an identifiable actor.
    const actor = createCaseIdentitySnapshot(req.user);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    const scope = resolveCaseScope(req);
    const existing = await getCaseById(id, scope.where);
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

    const caseRecord = await softDeleteCaseService(id, actor);

    logAuthEvent("case_soft_deleted", {
      case_id: id,
      file_number: existing.file_number,
      branch_id: existing.branch_id,
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
