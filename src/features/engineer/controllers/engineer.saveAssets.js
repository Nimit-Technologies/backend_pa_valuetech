import { saveAssetsSchema } from "../engineer-assets.schema.js";
import {
  saveMyAssets,
  formatAssetResponse,
} from "../services/engineer.assets.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const saveAssets = async (req, res, next) => {
  if (respondIfInvalidIdParam(req, res, next)) return;

  const parsed = saveAssetsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid assets",
      errors: parsed.error.issues,
    });
  }

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
    const assets = await saveMyAssets({
      taskId: req.params.id,
      userId,
      employeeId,
      branchId,
      assets: parsed.data.assets,
    });

    // Asset ids and a count only — never the storage path/URL alongside the
    // uploader's identity, same rule uploads.controller.js follows.
    logAuthEvent("report_assets_saved", {
      task_id: req.params.id,
      actor_id: userId,
      count: assets.length,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, data: assets.map(formatAssetResponse) });
  } catch (error) {
    return next(error);
  }
};
