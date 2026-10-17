import { getAllRemarks as getAllRemarksService } from "../services/service.getall.remark.js";
import { getCaseForRemark } from "../services/service.getCase.remark.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { resolveRemarkBranchScope } from "../utils/remark-scope.js";

export const getAllRemarks = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const caseId = req.params.id;
    const { direction, cursorId, search } = req.query;

    // The case is resolved first so an unknown or out-of-branch id reads as a
    // 404 rather than an empty list, which would be indistinguishable from a
    // case that simply has no remarks yet.
    const branchScope = resolveRemarkBranchScope(req);
    const caseRecord = await getCaseForRemark(caseId, branchScope);
    if (!caseRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    const {
      remarks,
      remarkFirstId,
      remarkLastId,
      hasNextPage,
      hasPreviousPage,
      remarkLength,
      dataLimit,
      totalCount,
    } = await getAllRemarksService({
      caseId: caseRecord.id,
      branchId: branchScope,
      direction,
      cursorId,
      search,
    });

    res.json({
      success: true,
      data: remarks,
      remarkFirstId,
      remarkLastId,
      hasNextPage,
      hasPreviousPage,
      remarkLength,
      dataLimit,
      totalCount,
    });
  } catch (error) {
    console.error("getAllRemarks error:", error);

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch remarks";
    res.status(status).json({ success: false, message });
  }
};
