import { getBusinessTypeById } from "../services/service.get.business-typeById.js";
import { restoreBusinessType as restoreBusinessTypeService } from "../services/service.restore.business-type.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";

export const restoreBusinessType = async (req, res) => {
  try {
    const { id } = req.params;

    // Resolved before the DB call so a branch-scoped caller's branch_id is
    // filtered in the query itself, instead of fetching the business type
    // and discarding it after if it belongs to another branch.
    const scope = resolveBranchScope(req);
    const existing = await getBusinessTypeById(id, scope);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Business type not found" });
    }

    if (!existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Business type is not soft-deleted" });
    }

    const businessType = await restoreBusinessTypeService(id);
    res.json({
      success: true,
      message: "Business type restored successfully",
      data: businessType,
    });
  } catch (error) {
    console.error("restoreBusinessType error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to restore business type" });
  }
};
