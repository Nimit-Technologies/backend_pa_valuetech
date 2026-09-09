import { getAllBranches as getAllBranchesService } from "../services/service.getall.branch.js";
import { formatBranchResponse } from "../utils/branch-history.js";

export const getAllBranches = async (req, res) => {
  try {
    const { direction, cursorId } = req.query;

    const {
      branches,
      branchFirstId,
      branchLastId,
      hasNextPage,
      hasPreviousPage,
      branchLength,
      dataLimit,
    } = await getAllBranchesService({ direction, cursorId });

    res.json({
      success: true,
      data: formatBranchResponse(branches),
      branchFirstId,
      branchLastId,
      hasNextPage,
      hasPreviousPage,
      branchLength,
      dataLimit,
    });
  } catch (error) {
    console.error("getAllBranches error:", error);
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch branches";
    res.status(status).json({ success: false, message });
  }
};
