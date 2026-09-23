import { findBankByName } from "../services/service.findByName.bank.js";
import { findBankByBranchCode } from "../services/service.findByBranchCode.bank.js";
import { findBankByGstNumber } from "../services/service.findByGstNumber.bank.js";
import { createBank as createBankService } from "../services/service.create.bank.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { bankSchema } from "../bank.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createBankHistoryEntry,
  formatBankResponse,
} from "../utils/bank-history.js";
import { SCOPED_DUPLICATE_MESSAGES } from "../utils/bank-duplicate-messages.js";

export const createBank = async (req, res) => {
  try {
    const parsed = bankSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { name, bank_branch_code, gst_number, branch_id } = parsed.data;

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

    const [existingName, existingBranchCode, existingGst] = await Promise.all([
      findBankByName(name, branch_id),
      findBankByBranchCode(bank_branch_code, branch_id),
      findBankByGstNumber(gst_number, branch_id),
    ]);
    if (existingName) {
      return res.status(409).json({
        success: false,
        message: SCOPED_DUPLICATE_MESSAGES.name,
      });
    }
    if (existingBranchCode) {
      return res.status(409).json({
        success: false,
        message: SCOPED_DUPLICATE_MESSAGES.bank_branch_code,
      });
    }
    if (existingGst) {
      return res.status(409).json({
        success: false,
        message: SCOPED_DUPLICATE_MESSAGES.gst_number,
      });
    }

    const historyEntry = createBankHistoryEntry("CREATE", req.user);
    const bank = await createBankService(parsed.data, historyEntry);

    logAuthEvent("bank_created", {
      bank_id: bank.id,
      branch_id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.status(201).json({ success: true, data: formatBankResponse(bank) });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      const scopedMessage = SCOPED_DUPLICATE_MESSAGES[field];
      if (scopedMessage) {
        console.error(`createBank error: ${scopedMessage}`);
        return res.status(409).json({ success: false, message: scopedMessage });
      }
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
