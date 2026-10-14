import { getRemarksForCase } from "../services/service.getall.remark.js";
import { getCaseForRemark } from "../services/service.getCase.remark.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { resolveRemarkBranchScope } from "../utils/remark-scope.js";

export const getAllRemarks = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const caseId = req.params.id;

    const take = Math.min(parseInt(req.query.limit) || 20, 100);
    const cursor = req.query.cursor || undefined;

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

    const remarks = await getRemarksForCase({
      caseId: caseRecord.id,
      branchId: branchScope,
      take,
      cursor,
    });

    const nextCursor =
      remarks.length === take ? remarks[remarks.length - 1].id : null;

    res.json({ success: true, data: remarks, nextCursor });
  } catch (error) {
    console.error("getAllRemarks error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch remarks" });
  }
};
