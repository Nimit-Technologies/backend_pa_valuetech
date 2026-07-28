import { getBankById } from "../services/service.getById.bank.js";
import { findBankByName } from "../services/service.findByName.bank.js";
import { updateBank as updateBankService } from "../services/service.update.bank.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { updateBankSchema } from "../bank.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";

export const updateBank = async (req, res) => {
  try {
    const { id } = req.params;

    const parsed = updateBankSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error(
        `updateBank validation error for bank ${id}:`,
        JSON.stringify(parsed.error.issues, null, 2)
      );
      return res.status(400).json({
        success: false,
        message: "Invalid request data. Please check the fields you're trying to update.",
        errors: parsed.error.issues,
      });
    }

    const existing = await getBankById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Bank not found" });
    }

    const { name, branch_id } = parsed.data;

    if (branch_id) {
      const branch = await getBranchById(branch_id);
      if (respondIfInvalidParent(res, branch, { label: "Branch", action: "reassign bank to it" })) return;
    }

    if (name) {
      const duplicate = await findBankByName(name);
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({ success: false, message: "Bank with this name already exists" });
      }
    }

    const bank = await updateBankService(id, parsed.data);
    res.json({ success: true, data: bank });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      console.error(`updateBank error: bank with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`);
      return res.status(409).json({ success: false, message: "Bank already exists" });
    }
    console.error("updateBank error:", error);
    res.status(500).json({ success: false, message: "Failed to update bank" });
  }
};
