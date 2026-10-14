import { findStatusByName } from "../services/service.getStatusByName.js";
import { findStatusByCode } from "../services/service.getStatusByCode.js";
import { createStatus as createStatusService } from "../services/service.create.status.js";
import { statusSchema } from "../status.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { formatStatusResponse } from "../utils/status-response.js";

export const createStatus = async (req, res) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { code, name, sort_order, is_terminal } = parsed.data;

    // Global checks — code and name are both unique across the whole table,
    // with no branch to scope them to. Both @unique constraints cover
    // soft-deleted rows too, so either value is taken even when the row is
    // hidden; only the way out differs.
    const [existingCode, existingName] = await Promise.all([
      findStatusByCode(code),
      findStatusByName(name),
    ]);

    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: existingCode.deleted_at
          ? "A soft-deleted status with this code already exists; restore it instead"
          : "Status with this code already exists",
      });
    }

    if (existingName) {
      return res.status(409).json({
        success: false,
        message: existingName.deleted_at
          ? "A soft-deleted status with this name already exists; restore it instead"
          : "Status already exists",
      });
    }

    const status = await createStatusService({
      code,
      name,
      sort_order,
      is_terminal,
    });

    logAuthEvent("status_created", {
      status_id: status.id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.status(201).json({ success: true, data: formatStatusResponse(status) });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      console.error(
        `createStatus error: status with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`,
      );
      return res
        .status(409)
        .json({ success: false, message: "Status already exists" });
    }
    console.error("createStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create status" });
  }
};
