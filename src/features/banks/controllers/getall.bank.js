import { getAllBanks as getAllBanksService } from "../services/service.getall.bank.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { formatBankResponse } from "../utils/bank-history.js";

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
      totalCount,
      totalActiveCount,
    } = await getAllBanksService({ direction, cursorId, branchId });
    res.json({
      success: true,
      data: formatBankResponse(banks),
      bankFirstId,
      bankLastId,
      hasNextPage,
      hasPreviousPage,
      bankLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    });
  } catch (error) {
    console.error("getAllBanks error:", error);

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch Banks";
    res.status(status).json({ success: false, message });
  }
};
