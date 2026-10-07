import { findBusinessTypeByName } from "../services/service.getBusinessTypeByName.js";
import { createBusinessType as createBusinessTypeService } from "../services/service.create.business-type.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { businessTypeSchema } from "../business-type.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { SCOPED_DUPLICATE_MESSAGES } from "../utils/business-type-duplicate-messages.js";

export const createBusinessType = async (req, res) => {
  try {
    const parsed = businessTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { name, branch_id } = parsed.data;

    const scope = resolveBranchScope(req);
    if (scope && branch_id !== scope) {
      return res.status(403).json({
        success: false,
        message: "You can only create business types for your own branch",
      });
    }

    const branch = await getBranchById(branch_id);
    if (
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "assign new business types to it",
      })
    )
      return;

    // Scoped to branch_id: the same name is allowed under another branch.
    const existing = await findBusinessTypeByName(name, branch_id);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: SCOPED_DUPLICATE_MESSAGES.name,
      });
    }

    const businessType = await createBusinessTypeService({ name, branch_id });
    res.status(201).json({ success: true, data: businessType });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      const scopedMessage = SCOPED_DUPLICATE_MESSAGES[field];
      if (scopedMessage) {
        console.error(`createBusinessType error: ${scopedMessage}`);
        return res.status(409).json({ success: false, message: scopedMessage });
      }
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
