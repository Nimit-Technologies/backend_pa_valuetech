import { mySubmittedReportsQuerySchema } from "../engineer.schema.js";
import { listMySubmittedReports } from "../services/engineer.report.js";

export const getMySubmittedReports = async (req, res, next) => {
  const userId = req.user?.id;
  const employeeId = req.user?.employee_id;
  const branchId = req.user?.branch?.id;
  if (!userId || !employeeId || !branchId) {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please log in again.",
    });
  }

  const parsed = mySubmittedReportsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ success: false, errors: parsed.error.issues });
  }

  try {
    const data = await listMySubmittedReports({
      ...parsed.data,
      userId,
      employeeId,
      branchId,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};
