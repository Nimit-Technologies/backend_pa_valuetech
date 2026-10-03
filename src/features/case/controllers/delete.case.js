import { getCaseById } from "../services/service.getById.case.js";
import { deleteCase as deleteCaseService } from "../services/service.delete.case.js";
import { getCaseDependents } from "../services/service.checkDependents.case.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const deleteCase = async (req, res, next) => {
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

    const { allocations } = await getCaseDependents(id);
    if (allocations.length) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete case: allocation(s) still exist for this case",
        data: allocations.map((allocation) => ({
          type: "allocation",
          id: allocation.id,
          sequence: allocation.sequence,
          name: `${allocation.user?.first_name ?? ""} ${
            allocation.user?.last_name ?? ""
          }`.trim(),
        })),
      });
    }

    await deleteCaseService(id);

    logAuthEvent("case_deleted", {
      case_id: id,
      file_number: existing.file_number,
      branch_id: existing.branch_id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, message: "Case deleted successfully" });
  } catch (error) {
    if (error?.code === "P2003" || error?.code === "P2014") {
      return res.status(409).json({
        success: false,
        message: "Cannot delete case: it is still referenced by other records",
      });
    }
    console.error("deleteCase error:", error);
    res.status(500).json({ success: false, message: "Failed to delete case" });
  }
};
