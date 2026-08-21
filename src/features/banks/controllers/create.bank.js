import { findBankByName } from "../services/service.findByName.bank.js";
import { createBank as createBankService } from "../services/service.create.bank.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { bankSchema } from "../bank.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const createBank = async (req, res) => {
  try {
    const parsed = bankSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { name, display_name, gst_number, branch_code, branch_id, address } =
      parsed.data;

    const scope = resolveBranchScope(req);
    if (scope && branch_id !== scope) {
      return res.status(403).json({
        success: false,
        message: "You can only create banks for your own branch",
      });
    }

    const branch = await getBranchById(branch_id);
    if (
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "assign new banks to it",
      })
    )
      return;

    const existing = await findBankByName(name);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Bank already exists" });
    }

    const bank = await createBankService({
      name,
      display_name,
      gst_number,
      branch_code,
      branch_id,
      address,
    });

    logAuthEvent("bank_created", {
      bank_id: bank.id,
      branch_id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.status(201).json({ success: true, data: bank });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      console.error(
        `createBank error: bank with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`,
      );
      return res
        .status(409)
        .json({ success: false, message: "Bank already exists" });
    }
    console.error("createBank error:", error);
    res.status(500).json({ success: false, message: "Failed to create bank" });
  }
};
