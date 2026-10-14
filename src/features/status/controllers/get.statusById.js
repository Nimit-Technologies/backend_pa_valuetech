import { getStatusById as getStatusByIdService } from "../services/service.getStatusById.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { formatStatusResponse } from "../utils/status-response.js";

export const getStatusById = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    const status = await getStatusByIdService(id);

    if (!status) {
      return res
        .status(404)
        .json({ success: false, message: "Status not found" });
    }

    // Soft-deleted rows are returned rather than 404'd: this route is super
    // admin only, and they need to see a soft-deleted status to decide
    // between restoring and hard-deleting it. `is_deleted` marks it.
    res.json({ success: true, data: formatStatusResponse(status) });
  } catch (error) {
    console.error("getStatusById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch status" });
  }
};
