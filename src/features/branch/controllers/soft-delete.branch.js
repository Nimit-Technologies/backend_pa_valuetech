import { getBranchById } from "../services/service.getById.branch.js";
import { softDeleteBranch as softDeleteBranchService } from "../services/service.softDelete.branch.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { createBranchHistoryEntry } from "../utils/branch-history.js";

export const softDeleteBranch = async (req, res, next) => {
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
    const existing = await getBranchById(id);
    if (!existing || existing.deleted_at) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    const historyEntry = createBranchHistoryEntry("SOFT_DELETE", req.user);
    await softDeleteBranchService(id, historyEntry, existing.history);

    logAuthEvent("branch_soft_deleted", {
      branch_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, message: "Branch soft-deleted successfully" });
  } catch (error) {
    console.error("softDeleteBranch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to soft-delete branch" });
  }
};
