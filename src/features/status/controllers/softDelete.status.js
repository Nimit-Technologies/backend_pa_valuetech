import { getStatusById } from "../services/service.getStatusById.js";
import { softDeleteStatus as softDeleteStatusService } from "../services/service.softDelete.status.js";

export const softDeleteStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getStatusById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Status not found" });
        }
        if (existing.deleted_at) {
            return res.status(409).json({ success: false, message: "Status is already deleted" });
        }

        const status = await softDeleteStatusService(id);
        res.json({ success: true, message: "Status soft-deleted successfully", data: status });
    } catch (error) {
        console.error("softDeleteStatus error:", error);
        res.status(500).json({ success: false, message: "Failed to soft-delete status" });
    }
};
