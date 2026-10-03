import { getCaseById } from "../services/service.getById.case.js";
import { findCaseByFileNumber } from "../services/service.findByFileNumber.case.js";
import { updateCase as updateCaseService } from "../services/service.update.case.js";
import { getBankById } from "../../banks/services/service.getById.bank.js";
import { getBusinessTypeById } from "../../business_type/services/service.get.business-typeById.js";
import { getUserByEmployeeId } from "../../users/services/service.getByEmployeeId.js";
import { updateCaseSchema } from "../case.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createCaseIdentitySnapshot,
  formatCaseResponse,
} from "../utils/case-history.js";
import { SCOPED_DUPLICATE_MESSAGES } from "../utils/case-duplicate-messages.js";

// True if `data` (only the keys the caller actually sent, since
// updateCaseSchema fields are all optional) would change anything on
// `existing`. Keeps a no-op PUT from hitting the DB or re-triggering
// downstream effects (updated_at bump, update-history row, audit log, etc.).
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

export const updateCase = async (req, res, next) => {
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

    const parsed = updateCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error(
        `updateCase validation error for case ${id}:`,
        JSON.stringify(parsed.error.issues, null, 2),
      );
      return res.status(400).json({
        success: false,
        message:
          "Invalid request data. Please check the fields you're trying to update.",
        errors: parsed.error.issues,
      });
    }

    // Every write to a case appends an update-history row, which requires an
    // identifiable actor to attribute it to.
    const actor = createCaseIdentitySnapshot(req.user);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    // Resolved before the DB call so a branch-scoped caller's branch_id is
    // filtered in the query itself, instead of fetching the case first and
    // discarding it after if it belongs to another branch.
    const scope = resolveBranchScope(req);
    const existing = await getCaseById(id, scope);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Case is soft-deleted; restore it before updating",
      });
    }

    if (!hasChanges(existing, parsed.data)) {
      return res.json({ success: true, message: "No changes are found" });
    }

    const {
      file_number,
      bank_id,
      business_type_id,
      employee_id,
      branch_id: bodyBranchId,
    } = parsed.data;

    const noFileNumberChange =
      file_number === undefined || file_number === existing.file_number;
    const noBankChange = bank_id === undefined || bank_id === existing.bank_id;
    const noBusinessTypeChange =
      business_type_id === undefined ||
      business_type_id === existing.business_type_id;
    const noEmployeeChange =
      employee_id === undefined || employee_id === existing.employee_id;

    // A case's branch always follows the branch of the bank it is filed under,
    // so it is re-derived from the (possibly new) bank rather than trusted from
    // the client, exactly as on create.
    let targetBranchId = existing.branch_id;
    if (!noBankChange) {
      const bank = await getBankById(bank_id);
      if (
        respondIfInvalidParent(res, bank, {
          label: "Bank",
          action: "move cases under it",
        })
      )
        return;
      targetBranchId = bank.branch_id;
    }

    if (bodyBranchId !== undefined && bodyBranchId !== targetBranchId) {
      return res.status(409).json({
        success: false,
        message: "Bank does not belong to the given branch",
      });
    }

    const noBranchChange = targetBranchId === existing.branch_id;
    if (!noBranchChange && scope) {
      return res.status(403).json({
        success: false,
        message: "You cannot reassign a case to another branch",
      });
    }

    if (!noBusinessTypeChange) {
      const businessType = await getBusinessTypeById(business_type_id);
      if (
        respondIfInvalidParent(res, businessType, {
          label: "Business type",
          action: "move cases into it",
        })
      )
        return;
    }

    // Re-check the assigned employee whenever the employee OR the branch
    // changes: a case's employee must always belong to the case's branch.
    if (!noEmployeeChange || !noBranchChange) {
      const targetEmployeeId = noEmployeeChange
        ? existing.employee_id
        : employee_id;
      const assignedUser = await getUserByEmployeeId(targetEmployeeId);
      if (
        respondIfInvalidParent(res, assignedUser, {
          label: "Employee",
          action: "assign cases to them",
        })
      )
        return;

      // Raw row from getUserByEmployeeId — branch is the branch_id scalar.
      if (assignedUser.branch_id !== targetBranchId) {
        return res.status(409).json({
          success: false,
          message: "Assigned employee does not belong to this branch",
        });
      }
    }

    // File numbers are unique per branch, so re-check whenever the file number
    // OR the branch changes, against the values the row will end up with.
    if (!noFileNumberChange || !noBranchChange) {
      const targetFileNumber = noFileNumberChange
        ? existing.file_number
        : file_number;
      const duplicate = await findCaseByFileNumber(
        targetFileNumber,
        targetBranchId,
      );
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({
          success: false,
          message: SCOPED_DUPLICATE_MESSAGES.file_number,
        });
      }
    }

    // Only send branch_id when it actually moves; the client-supplied value is
    // never written as-is.
    const data = { ...parsed.data };
    if (noBranchChange) {
      delete data.branch_id;
    } else {
      data.branch_id = targetBranchId;
    }

    const caseRecord = await updateCaseService(id, data, actor, existing);

    logAuthEvent("case_updated", {
      case_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
      ...(noBranchChange
        ? {}
        : {
            from_branch_id: existing.branch_id,
            to_branch_id: targetBranchId,
          }),
      ...(noBankChange
        ? {}
        : { from_bank_id: existing.bank_id, to_bank_id: bank_id }),
    });

    res.json({
      success: true,
      message: "Case updated successfully",
      data: formatCaseResponse(caseRecord),
    });
  } catch (error) {
    // A concurrent write slipped past the duplicate check above — only
    // reachable once (file_number, branch_id) is a unique index.
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      const scopedMessage = SCOPED_DUPLICATE_MESSAGES[field];
      if (scopedMessage) {
        console.error(`updateCase error: ${scopedMessage}`);
        return res.status(409).json({ success: false, message: scopedMessage });
      }
      return res
        .status(409)
        .json({ success: false, message: "Case already exists" });
    }
    console.error("updateCase error:", error);
    res.status(500).json({ success: false, message: "Failed to update case" });
  }
};
