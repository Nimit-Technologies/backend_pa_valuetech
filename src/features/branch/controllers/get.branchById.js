import { getBranchById as getBranchByIdService } from "../services/service.getById.branch.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { formatBranchResponse } from "../utils/branch-history.js";

export const getBranchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isValidId = isValidCuid(id);

    if (!isValidId) {
      if (!looksLikeAnId(id)) {
        return next();
      }
      return res
        .status(404)
        .json({ success: false, message: "Id is not valid" });
    }
    const branch = await getBranchByIdService(id);

    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    res.json({ success: true, data: formatBranchResponse(branch) });
  } catch (error) {
    console.error("getBranchById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch branch" });
  }
};
