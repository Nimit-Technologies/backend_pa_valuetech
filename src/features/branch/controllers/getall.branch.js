import { getAllBranches as getAllBranchesService } from "../services/service.getall.branch.js";
import { formatBranchResponse } from "../utils/branch-history.js";

export const getAllBranches = async (req, res) => {
  try {
    const { direction, cursorId, search } = req.query;

    const {
      branches,
      branchFirstId,
      branchLastId,
      hasNextPage,
      hasPreviousPage,
      branchLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    } = await getAllBranchesService({ direction, cursorId, search });

    res.json({
      success: true,
      data: formatBranchResponse(branches),
      branchFirstId,
      branchLastId,
      hasNextPage,
      hasPreviousPage,
      branchLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    });
  } catch (error) {
    console.error("getAllBranches error:", error);
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch branches";
    res.status(status).json({ success: false, message });
  }
};
