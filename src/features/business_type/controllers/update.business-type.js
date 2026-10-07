import { getBusinessTypeById } from "../services/service.get.business-typeById.js";
import { findBusinessTypeByName } from "../services/service.getBusinessTypeByName.js";
import { updateBusinessType as updateBusinessTypeService } from "../services/service.update.business-type.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { updateBusinessTypeSchema } from "../business-type.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { SCOPED_DUPLICATE_MESSAGES } from "../utils/business-type-duplicate-messages.js";

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

    // Resolved before the DB call so a branch-scoped caller's branch_id is
    // filtered in the query itself, instead of fetching the business type
    // first and discarding it after if it belongs to another branch.
    const scope = resolveBranchScope(req);
    const existing = await getBusinessTypeById(id, scope);
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

    const { name, branch_id } = parsed.data;

    if (scope && branch_id && branch_id !== scope) {
      return res.status(403).json({
        success: false,
        message: "You can only move business types within your own branch",
      });
    }

    if (branch_id && branch_id !== existing.branch_id) {
      const branch = await getBranchById(branch_id);
      if (
        respondIfInvalidParent(res, branch, {
          label: "Branch",
          action: "assign business types to it",
        })
      )
        return;
    }

    // The name only has to be free within the branch the row will live in
    // after this update, which is the new branch_id when one was sent.
    const targetBranchId = branch_id ?? existing.branch_id;
    if (name || branch_id) {
      const duplicate = await findBusinessTypeByName(
        name ?? existing.name,
        targetBranchId,
      );
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({
          success: false,
          message: SCOPED_DUPLICATE_MESSAGES.name,
        });
      }
    }

    const businessType = await updateBusinessTypeService(id, parsed.data);
    res.json({ success: true, data: businessType });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      const scopedMessage = SCOPED_DUPLICATE_MESSAGES[field];
      if (scopedMessage) {
        console.error(`updateBusinessType error: ${scopedMessage}`);
        return res.status(409).json({ success: false, message: scopedMessage });
      }
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
