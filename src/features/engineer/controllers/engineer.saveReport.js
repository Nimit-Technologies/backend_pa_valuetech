import { saveReportSchema } from "../engineer-report.schema.js";
import { saveMyReport } from "../services/engineer.report.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";

export const saveReport = async (req, res, next) => {
  if (respondIfInvalidIdParam(req, res, next)) return;

  const parsed = saveReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid report",
      errors: parsed.error.issues,
    });
  }

  try {
    const { userId, employeeId, branchId } = {
      userId: req.user?.id,
      employeeId: req.user?.employee_id,
      branchId: req.user?.branch?.id,
    };
    if (!userId || !employeeId || !branchId) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    const result = await saveMyReport({
      taskId: req.params.id,
      userId,
      employeeId,
      branchId,
      ...parsed.data,
    });

    return res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.report.isDraft
        ? "Report draft saved"
        : "Report submitted",
      data: result.report,
    });
  } catch (error) {
    return next(error);
  }
};
