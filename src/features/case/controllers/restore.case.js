import { getCaseById } from "../services/service.getById.case.js";
import { restoreCase as restoreCaseService } from "../services/service.restore.case.js";
import { getBankById } from "../../banks/services/service.getById.bank.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createCaseIdentitySnapshot,
  formatCaseResponse,
} from "../utils/case-history.js";

export const restoreCase = async (req, res, next) => {
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

    // The restore is recorded as an update-history row, which needs an
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

    if (!existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Case is not soft-deleted" });
    }

    // A restore has to land somewhere valid: the bank the case is filed under
    // and the branch it belongs to must both still be live. The assigned user
    // and business type are not re-checked — those are editable afterwards,
    // and a live case can already outlive either of them.
    const [bank, branch] = await Promise.all([
      getBankById(existing.bank_id),
      getBranchById(existing.branch_id),
    ]);

    if (
      respondIfInvalidParent(res, bank, {
        label: "Bank",
        action: "restore this case",
      })
    )
      return;

    if (
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "restore this case",
      })
    )
      return;

    const caseRecord = await restoreCaseService(id, actor, existing);

    logAuthEvent("case_restored", {
      case_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Case restored successfully",
      data: formatCaseResponse(caseRecord),
    });
  } catch (error) {
    console.error("restoreCase error:", error);
    res.status(500).json({ success: false, message: "Failed to restore case" });
  }
};
