import {
  findMyAssets,
  formatAssetResponse,
} from "../services/engineer.assets.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";

export const getAssets = async (req, res, next) => {
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
    const assets = await findMyAssets({
      taskId: req.params.id,
      userId,
      employeeId,
      branchId,
    });

    res.json({ success: true, data: assets.map(formatAssetResponse) });
  } catch (error) {
    return next(error);
  }
};
