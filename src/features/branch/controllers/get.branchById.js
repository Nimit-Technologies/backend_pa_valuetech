import { getBranchById as getBranchByIdService } from "../services/service.getById.branch.js";

export const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await getBranchByIdService(id);

    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    res.json({ success: true, data: branch });
  } catch (error) {
    console.error("getBranchById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch branch" });
  }
};
