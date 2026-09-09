import { getBranchById } from "../services/service.getById.branch.js";
import { updateBranch as updateBranchService } from "../services/service.update.branch.js";
import { findBranchByName } from "../services/service.findByName.branch.js";
import { branchSchema } from "../branch.schema.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createBranchHistoryEntry,
  formatBranchResponse,
} from "../utils/branch-history.js";

export const updateBranch = async (req, res, next) => {
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
    const parsed = branchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { name } = parsed.data;

    const existing = await getBranchById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Branch is soft-deleted; restore it before updating",
      });
    }

    if (existing.name === name) {
      return res.json({ success: true, message: "No changes are found" });
    }

    const duplicate = await findBranchByName(name, id);
    if (duplicate) {
      return res
        .status(409)
        .json({ success: false, message: "Branch already exists" });
    }

    const historyEntry = createBranchHistoryEntry("UPDATE", req.user);
    const branch = await updateBranchService(
      id,
      name,
      historyEntry,
      existing.history,
    );

    logAuthEvent("branch_updated", {
      branch_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, data: formatBranchResponse(branch) });
  } catch (error) {
    console.error("updateBranch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update branch" });
  }
};
