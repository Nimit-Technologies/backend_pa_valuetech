import { findMyReport } from "../services/engineer.report.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";

export const getMyReport = async (req, res, next) => {
  if (respondIfInvalidIdParam(req, res, next)) return;

  const userId = req.user?.id;
  const employeeId = req.user?.employee_id;
  const branchId = req.user?.branch?.id;
  if (!userId || !employeeId || !branchId) {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please log in again.",
    });
  }

  try {
    const report = await findMyReport({
      taskId: req.params.id,
      userId,
      employeeId,
      branchId,
    });
    return res.json({ success: true, data: report });
  } catch (error) {
    return next(error);
  }
};
