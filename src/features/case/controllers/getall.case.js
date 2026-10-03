import { getAllCases as getAllCasesService } from "../services/service.getall.case.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { formatCaseResponse } from "../utils/case-history.js";

export const getAllCases = async (req, res) => {
  try {
    const { direction, cursorId, search } = req.query;
    // A non-super-admin only ever sees cases in their own branch.
    const branchId = resolveBranchScope(req);

    const {
      cases,
      caseFirstId,
      caseLastId,
      hasNextPage,
      hasPreviousPage,
      caseLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    } = await getAllCasesService({ direction, cursorId, search, branchId });
    res.json({
      success: true,
      data: formatCaseResponse(cases),
      caseFirstId,
      caseLastId,
      hasNextPage,
      hasPreviousPage,
      caseLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    });
  } catch (error) {
    console.error("getAllCases error:", error);

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch cases";
    res.status(status).json({ success: false, message });
  }
};
