import {
  findAssetsByCaseIdForBranch,
  formatAssetResponse,
} from "../services/engineer.assets.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";

export const getCaseAssets = async (req, res, next) => {
  if (respondIfInvalidIdParam(req, res, next)) return;

  const branchId = req.user?.branch?.id;
  if (!branchId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not assigned to a branch.",
    });
  }

  try {
    const assets = await findAssetsByCaseIdForBranch({
      caseId: req.params.id,
      branchId,
    });

    res.json({ success: true, data: assets.map(formatAssetResponse) });
  } catch (error) {
    return next(error);
  }
};
