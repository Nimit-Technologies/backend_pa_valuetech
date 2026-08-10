import { findStatusByName } from "../services/service.getStatusByName.js";
import { createStatus as createStatusService } from "../services/service.create.status.js";
import { statusSchema } from "../status.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";

export const createStatus = async (req, res) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { name, sort_order } = parsed.data;

    const existing = await findStatusByName(name);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Status already exists" });
    }

    const status = await createStatusService({ name, sort_order });
    res.status(201).json({ success: true, data: status });
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
