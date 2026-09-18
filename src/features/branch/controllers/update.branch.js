import { getBranchById } from "../services/service.getById.branch.js";
import { updateBranch as updateBranchService } from "../services/service.update.branch.js";
import { findBranchByName } from "../services/service.findByName.branch.js";
import { updateBranchSchema } from "../branch.schema.js";
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
        return next();
      }
      return res
        .status(404)
        .json({ success: false, message: "Id is not valid" });
    }
    const parsed = updateBranchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
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
        message: "Branch is soft-deleted; restore it before updating",
      });
    }

    const { name, is_active } = parsed.data;

    const noNameChange = name === undefined || name === existing.name;
    const noActiveChange =
      is_active === undefined || is_active === existing.is_active;
    if (noNameChange && noActiveChange) {
      return res.json({ success: true, message: "No changes are found" });
    }

    // Only hit the DB for a duplicate if the name is actually changing.
    if (!noNameChange) {
      const duplicate = await findBranchByName(name);
      if (duplicate && duplicate.id !== id) {
        return res
          .status(409)
          .json({ success: false, message: "Branch already exists" });
      }
    }

    const historyEntry = createBranchHistoryEntry("UPDATE", req.user);
    const branch = await updateBranchService(
      id,
      parsed.data,
      historyEntry,
      existing,
    );

    logAuthEvent("branch_updated", {
      branch_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Branch updated successfully",
      data: formatBranchResponse(branch),
    });
  } catch (error) {
    console.error("updateBranch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update branch" });
  }
};
