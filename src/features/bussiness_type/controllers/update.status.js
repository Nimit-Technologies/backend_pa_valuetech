import { getStatusById } from "../services/service.getStatusById.js";
import { findStatusByName } from "../services/service.getStatusByName.js";
import { updateStatus as updateStatusService } from "../services/service.update.status.js";
import { updateStatusSchema } from "../status.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";

export const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const parsed = updateStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid request data. Please check the fields you're trying to update.",
                errors: parsed.error.issues,
            });
        }

        const existing = await getStatusById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Status not found" });
        }

        if (existing.deleted_at) {
            return res.status(409).json({ success: false, message: "Status is deleted; cannot update a deleted status" });
        }

        const { name } = parsed.data;
        if (name) {
            const duplicate = await findStatusByName(name);
            if (duplicate && duplicate.id !== id) {
                return res.status(409).json({ success: false, message: "Status with this name already exists" });
            }
        }

        const status = await updateStatusService(id, parsed.data);
        res.json({ success: true, data: status });
    } catch (error) {
        if (error?.code === "P2002") {
            const field = getUniqueConstraintField(error);
            console.error(`updateStatus error: status with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`);
            return res.status(409).json({ success: false, message: "Status already exists" });
        }
        console.error("updateStatus error:", error);
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};
