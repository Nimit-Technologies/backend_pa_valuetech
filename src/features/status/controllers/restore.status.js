import { getStatusById } from "../services/service.getStatusById.js";
import { restoreStatus as restoreStatusService } from "../services/service.restore.status.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { formatStatusResponse } from "../utils/status-response.js";

export const restoreStatus = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    const existing = await getStatusById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Status not found" });
    }

    if (!existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Status is not soft-deleted" });
    }

    // No parent to re-validate: Status is global, so unlike a bank or a
    // business type there is no branch that could have gone inactive while
    // this row was soft-deleted.
    const status = await restoreStatusService(id);

    logAuthEvent("status_restored", {
      status_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Status restored successfully",
      data: formatStatusResponse(status),
    });
  } catch (error) {
    console.error("restoreStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to restore status" });
  }
};
