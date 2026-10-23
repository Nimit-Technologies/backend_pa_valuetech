import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { findSubmittedReportByCaseIdForBranch } from "../services/engineer.report.js";

export const getBranchSubmittedReport = async (req, res, next) => {
  if (respondIfInvalidIdParam(req, res, next)) return;

  const branchId = req.user?.branch?.id;
  if (!branchId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not assigned to a branch.",
    });
  }

  try {
    const data = await findSubmittedReportByCaseIdForBranch({
      caseId: req.params.id,
      branchId,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};
