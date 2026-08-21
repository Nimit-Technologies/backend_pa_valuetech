import { getAllBanks as getAllBanksService } from "../services/service.getall.bank.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";

export const getAllBanks = async (req, res) => {
  try {
    const { direction, cursorId } = req.query;
    const branchId = resolveBranchScope(req);
    const {
      banks,
      bankFirstId,
      bankLastId,
      hasNextPage,
      hasPreviousPage,
      bankLength,
      dataLimit,
    } = await getAllBanksService({ direction, cursorId, branchId });
    res.json({
      success: true,
      data: banks,
      bankFirstId,
      bankLastId,
      hasNextPage,
      hasPreviousPage,
      bankLength,
      dataLimit,
    });
  } catch (error) {
    console.error("getAllBanks error:", error);

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch Banks";
    res.status(status).json({ success: false, message });
  }
};
