import { findBusinessTypeByName } from "../services/service.getBusinessTypeByName.js";
import { createBusinessType as createBusinessTypeService } from "../services/service.create.business-type.js";
import { businessTypeSchema } from "../business-type.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";


export const createBusinessType = async (req, res) => {
  try {
    const parsed = businessTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { name } = parsed.data;

    const existing = await findBusinessTypeByName(name);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Business type already exists" });
    }

    const businessType = await createBusinessTypeService({ name });
    res.status(201).json({ success: true, data: businessType });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      console.error(
        `createBusinessType error: business type with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`,
      );
      return res
        .status(409)
        .json({ success: false, message: "Business type already exists" });
    }
    console.error("createBusinessType error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create business type" });
  }
};
