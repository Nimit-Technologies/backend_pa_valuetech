import { getBranchById } from "../services/service.getById.branch.js";
import { deleteBranch as deleteBranchService } from "../services/service.delete.branch.js";

export const deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getBranchById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Branch not found" });
        }

        await deleteBranchService(id);
        res.json({ success: true, message: "Branch deleted successfully" });
    } catch (error) {
        console.error("deleteBranch error:", error);
        res.status(500).json({ success: false, message: "Failed to delete branch" });
    }
};
