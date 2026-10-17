import { getStatusById } from "../services/service.getStatusById.js";
import { deleteStatus as deleteStatusService } from "../services/service.delete.status.js";
import { getStatusDependents } from "../services/service.checkDependents.status.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { isSystemStatusCode } from "../../../constant/case-status.js";

export const deleteStatus = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    const existing = await getStatusById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Status not found" });
    }

    // A system status is part of the case lifecycle that code branches on;
    // removing one would leave transition rules pointing at nothing.
    if (isSystemStatusCode(existing.code)) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete a system status: it is part of the case lifecycle. Deactivate it instead.",
      });
    }

    // Case.status_id and Allocation.status_id are both onDelete: Restrict, so
    // this check is what turns the DB's refusal into a 409 that names the
    // blocking records. Soft-deleted rows still count — see the service.
    const { cases, allocations } = await getStatusDependents(id);
    if (cases.length) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete status: it is still referenced by one or more cases",
        data: cases,
      });
    }

    if (allocations.length) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete status: it is still referenced by one or more allocations",
        data: allocations,
      });
    }

    await deleteStatusService(id);

    logAuthEvent("status_deleted", {
      status_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, message: "Status deleted successfully" });
  } catch (error) {
    if (error?.code === "P2003" || error?.code === "P2014") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete status: it is still referenced by other records",
      });
    }
    console.error("deleteStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete status" });
  }
};
