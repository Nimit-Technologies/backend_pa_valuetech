import { getStatusById } from "../services/service.getStatusById.js";
import { findStatusByName } from "../services/service.getStatusByName.js";
import { updateStatus as updateStatusService } from "../services/service.update.status.js";
import { updateStatusSchema } from "../status.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { formatStatusResponse } from "../utils/status-response.js";

export const updateStatus = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid request data. Please check the fields you're trying to update.",
        errors: parsed.error.issues,
      });
    }

    const existing = await getStatusById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Status not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Status is deleted; restore it before updating",
      });
    }

    const { name } = parsed.data;
    if (name) {
      // excludeId so re-sending the row's own name is not a conflict.
      const duplicate = await findStatusByName(name, id);
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: duplicate.deleted_at
            ? "A soft-deleted status already uses this name; restore or hard-delete it first"
            : "Status with this name already exists",
        });
      }
    }

    const status = await updateStatusService(id, parsed.data);

    logAuthEvent("status_updated", {
      status_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, data: formatStatusResponse(status) });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      console.error(
        `updateStatus error: status with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`,
      );
      return res
        .status(409)
        .json({ success: false, message: "Status already exists" });
    }
    console.error("updateStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update status" });
  }
};
