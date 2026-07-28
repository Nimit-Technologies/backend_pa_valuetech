import { getBranchById } from "../services/service.getById.branch.js";
import { setBranchStatus } from "../services/service.updateStatus.branch.js";

export const updateBranchStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getBranchById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Branch not found" });
        }

        if (existing.deleted_at) {
            return res.status(409).json({ success: false, message: "Branch is soft-deleted; restore it before changing status" });
        }

        const is_active = !existing.is_active;
        const branch = await setBranchStatus(id, is_active);
        res.json({ success: true, message: `Branch ${is_active ? "activated" : "deactivated"} successfully`, data: branch });
    } catch (error) {
        console.error("updateBranchStatus error:", error);
        res.status(500).json({ success: false, message: "Failed to update branch status" });
    }
};
