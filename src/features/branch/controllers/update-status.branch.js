import { getBranchById } from "../services/service.getById.branch.js";
import { setBranchStatus } from "../services/service.updateStatus.branch.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createBranchHistoryEntry,
  formatBranchResponse,
} from "../utils/branch-history.js";

export const updateBranchStatus = async (req, res, next) => {
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

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Branch is soft-deleted; restore it before changing status",
      });
    }

    const is_active = !existing.is_active;
    const historyEntry = createBranchHistoryEntry(
      is_active ? "ACTIVATE" : "DEACTIVATE",
      req.user,
    );
    const branch = await setBranchStatus(id, is_active, historyEntry, existing);

    logAuthEvent(is_active ? "branch_activated" : "branch_deactivated", {
      branch_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: `Branch ${is_active ? "activated" : "deactivated"} successfully`,
      data: formatBranchResponse(branch),
    });
  } catch (error) {
    console.error("updateBranchStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update branch status" });
  }
};
