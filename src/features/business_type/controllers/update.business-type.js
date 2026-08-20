import { getBusinessTypeById } from "../services/service.get.business-typeById.js";
import { findBusinessTypeByName } from "../services/service.getBusinessTypeByName.js";
import { updateBusinessType as updateBusinessTypeService } from "../services/service.update.business-type.js";
import { updateBusinessTypeSchema } from "../business-type.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";

export const updateBusinessType = async (req, res) => {
  try {
    const { id } = req.params;

    const parsed = updateBusinessTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.issues,
      });
    }

    const existing = await getBusinessTypeById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Business type not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message:
          "Business type is deleted; cannot update a deleted business type",
      });
    }

    const { name } = parsed.data;
    if (name) {
      const duplicate = await findBusinessTypeByName(name);
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({
          success: false,
          message: "Business type with this name already exists",
        });
      }
    }

    const businessType = await updateBusinessTypeService(id, parsed.data);
    res.json({ success: true, data: businessType });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      console.error(
        `updateBusinessType error: business type with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`,
      );
      return res
        .status(409)
        .json({ success: false, message: "Business type already exists" });
    }
    console.error("updateBusinessType error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update business type" });
  }
};
