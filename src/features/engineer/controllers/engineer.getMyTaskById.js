import { findMyTask } from "../services/engineer.findMyTask.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";

const resolveActor = (req) => ({
  userId: req.user?.id,
  employeeId: req.user?.employee_id,
  branchId: req.user?.branch?.id,
});

const SESSION_EXPIRED = {
  success: false,
  message: "Your session has expired. Please log in again.",
};

export const getMyTaskById = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;

    const { userId, employeeId, branchId } = resolveActor(req);
    if (!userId || !employeeId || !branchId) {
      return res.status(401).json(SESSION_EXPIRED);
    }

    const task = await findMyTask({
      userId,
      branchId,
      employeeId,
      caseId: req.params.id,
    });

    // Not a 403: a case this engineer does not hold simply does not exist for
    // them, the same way utils/case-scope.js answers 404 rather than confirming
    // a record it will not show.
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error("getMyTaskById error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch the task" });
  }
};
