import { getStatusById as getStatusByIdService } from "../services/service.getStatusById.js";

export const getStatusById = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await getStatusByIdService(id);

        if (!status) {
            return res.status(404).json({ success: false, message: "Status not found" });
        }

        res.json({ success: true, data: status });
    } catch (error) {
        console.error("getStatusById error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch status" });
    }
};
