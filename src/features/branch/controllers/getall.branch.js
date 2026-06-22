import { getAllBranches as getAllBranchesService } from "../services/service.getall.branch.js";

export const getAllBranches = async (req, res) => {
    try {
        const branches = await getAllBranchesService();
        res.json({ success: true, data: branches });
    } catch (error) {
        console.error("getAllBranches error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch branches" });
    }
};
