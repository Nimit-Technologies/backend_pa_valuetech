import { getBranchById } from "../services/service.getById.branch.js";
import { restoreBranch as restoreBranchService } from "../services/service.restore.branch.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createBranchHistoryEntry,
  formatBranchResponse,
} from "../utils/branch-history.js";

export const restoreBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isValidId = isValidCuid(id);

    if (!isValidId) {
      if (!looksLikeAnId(id)) {
        return next();
      }
      return res
        .status(404)
        .json({ success: false, message: "Id is not valid" });
    }
    const existing = await getBranchById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    if (!existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Branch is not soft-deleted" });
    }

    const historyEntry = createBranchHistoryEntry("RESTORE", req.user);
    const branch = await restoreBranchService(id, historyEntry, existing);

    logAuthEvent("branch_restored", {
      branch_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Branch restored successfully",
      data: formatBranchResponse(branch),
    });
  } catch (error) {
    console.error("restoreBranch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to restore branch" });
  }
};
