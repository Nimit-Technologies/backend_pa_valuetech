import { getStatusById } from "../services/service.getStatusById.js";
import { deleteStatus as deleteStatusService } from "../services/service.delete.status.js";
import { getStatusDependents } from "../services/service.checkDependents.status.js";

export const deleteStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getStatusById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Status not found" });
        }

        const { allocations } = await getStatusDependents(id);
        if (allocations.length) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete status: it is still referenced by one or more allocations",
                data: allocations,
            });
        }

        await deleteStatusService(id);
        res.json({ success: true, message: "Status deleted successfully" });
    } catch (error) {
        if (error?.code === "P2003" || error?.code === "P2014") {
            return res.status(409).json({ success: false, message: "Cannot delete status: it is still referenced by other records" });
        }
        console.error("deleteStatus error:", error);
        res.status(500).json({ success: false, message: "Failed to delete status" });
    }
};
