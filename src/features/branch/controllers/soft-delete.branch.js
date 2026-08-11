import { getBranchById } from "../services/service.getById.branch.js";
import { softDeleteBranch as softDeleteBranchService } from "../services/service.softDelete.branch.js";

export const softDeleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getBranchById(id);
    if (!existing || existing.deleted_at) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    await softDeleteBranchService(id);
    res.json({ success: true, message: "Branch soft-deleted successfully" });
  } catch (error) {
    console.error("softDeleteBranch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to soft-delete branch" });
  }
};
