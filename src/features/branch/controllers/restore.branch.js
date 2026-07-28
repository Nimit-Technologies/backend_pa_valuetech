import { getBranchById } from "../services/service.getById.branch.js";
import { restoreBranch as restoreBranchService } from "../services/service.restore.branch.js";

export const restoreBranch = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getBranchById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Branch not found" });
        }

        if (!existing.deleted_at) {
            return res.status(409).json({ success: false, message: "Branch is not soft-deleted" });
        }

        const branch = await restoreBranchService(id);
        res.json({ success: true, message: "Branch restored successfully", data: branch });
    } catch (error) {
        console.error("restoreBranch error:", error);
        res.status(500).json({ success: false, message: "Failed to restore branch" });
    }
};
