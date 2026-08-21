import { getBankById } from "../services/service.getById.bank.js";
import { findBankByName } from "../services/service.findByName.bank.js";
import { updateBank as updateBankService } from "../services/service.update.bank.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { updateBankSchema } from "../bank.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

// True if `data` (only the keys the caller actually sent, since
// updateBankSchema fields are all optional) would change anything on
// `existing`. Keeps a no-op PUT from hitting the DB or re-triggering
// downstream effects (updated_at bump, audit log, etc.).
const hasChanges = (existing, data) =>
  Object.entries(data).some(([key, value]) => {
    if (key === "address") {
      if (!value || typeof value !== "object") return false;
      return Object.entries(value).some(
        ([addrKey, addrValue]) => existing.address?.[addrKey] !== addrValue,
      );
    }
    return existing[key] !== value;
  });

export const updateBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isValidId = isValidCuid(id);

    if (!isValidId) {
      if (!looksLikeAnId(id)) {
        // Not even shaped like an id — most likely a mistyped/renamed
        // route falling through to :id. Let Express keep matching so
        // app.js's catch-all reports the real "Route not found".
        return next();
      }
      return res
        .status(404)
        .json({ success: false, message: "Id is not valid" });
    }
    const parsed = updateBankSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error(
        `updateBank validation error for bank ${id}:`,
        JSON.stringify(parsed.error.issues, null, 2),
      );
      return res.status(400).json({
        success: false,
        message:
          "Invalid request data. Please check the fields you're trying to update.",
        errors: parsed.error.issues,
      });
    }

    const existing = await getBankById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }

    const scope = resolveBranchScope(req);
    if (scope && existing.branch_id !== scope) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Bank is soft-deleted; restore it before updating",
      });
    }

    if (!hasChanges(existing, parsed.data)) {
      return res.json({ success: true, message: "No changes are found" });
    }

    const { name, branch_id } = parsed.data;

    if (branch_id) {
      if (scope && branch_id !== scope) {
        return res.status(403).json({
          success: false,
          message: "You cannot reassign a bank to another branch",
        });
      }
      const branch = await getBranchById(branch_id);
      if (
        respondIfInvalidParent(res, branch, {
          label: "Branch",
          action: "reassign bank to it",
        })
      )
        return;
    }

    if (name) {
      const duplicate = await findBankByName(name);
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({
          success: false,
          message: "Bank with this name already exists",
        });
      }
    }

    const bank = await updateBankService(id, parsed.data);

    logAuthEvent("bank_updated", {
      bank_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, data: bank });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      console.error(
        `updateBank error: bank with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`,
      );
      return res
        .status(409)
        .json({ success: false, message: "Bank already exists" });
    }
    console.error("updateBank error:", error);
    res.status(500).json({ success: false, message: "Failed to update bank" });
  }
};
