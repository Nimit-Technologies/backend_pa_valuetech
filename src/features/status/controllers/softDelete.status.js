import { getStatusById } from "../services/service.getStatusById.js";
import { softDeleteStatus as softDeleteStatusService } from "../services/service.softDelete.status.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { formatStatusResponse } from "../utils/status-response.js";
import { isSystemStatusCode } from "../../../constant/case-status.js";

export const softDeleteStatus = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    const existing = await getStatusById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Status not found" });
    }
    if (existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Status is already deleted" });
    }

    // A system status is a step in the case lifecycle that the transition rules
    // reference by code. Hiding `open` would break case creation outright, so
    // the whole seeded set is protected here as well as on hard delete.
    if (isSystemStatusCode(existing.code)) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete a system status: it is part of the case lifecycle. Deactivate it instead.",
      });
    }

    // Cases and allocations pointing at this status are intentionally left
    // alone: a soft delete only hides the status from new records, and existing
    // rows keep resolving it. The hard delete is the one that has to be blocked.
    const status = await softDeleteStatusService(id);

    logAuthEvent("status_soft_deleted", {
      status_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Status soft-deleted successfully",
      data: formatStatusResponse(status),
    });
  } catch (error) {
    console.error("softDeleteStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to soft-delete status" });
  }
};
