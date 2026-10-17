import { getCaseById } from "../services/service.getById.case.js";
import { findCaseByFileNumber } from "../services/service.findByFileNumber.case.js";
import { updateCase as updateCaseService } from "../services/service.update.case.js";
import { getBankById } from "../../banks/services/service.getById.bank.js";
import { getBusinessTypeById } from "../../business_type/services/service.get.business-typeById.js";
import { updateCaseSchema } from "../case.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { resolveCaseScope, CASE_SCOPE } from "../../../utils/case-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createCaseIdentitySnapshot,
  formatCaseResponse,
} from "../utils/case-history.js";
import { SCOPED_DUPLICATE_MESSAGES } from "../utils/case-duplicate-messages.js";

// True if `data` (only the keys the caller actually sent, since
// updateCaseSchema fields are all optional) would change anything on
// `existing`. Keeps a no-op PUT from hitting the DB or re-triggering
// downstream effects — the updated_by snapshot, a history row, the audit log.
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
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    const parsed = updateCaseSchema.safeParse(req.body);
    if (!parsed.success) {
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

    const scope = resolveCaseScope(req);
    const existing = await getCaseById(id, scope.where);
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

    // A closed or cancelled case is a delivered work product: the report has
    // gone to the bank, and editing it afterwards would leave our record
    // disagreeing with theirs. Reopening is the way back in, and it is branch
    // admin only.
    if (existing.status?.is_terminal) {
      return res.status(409).json({
        success: false,
        message: `Case is ${existing.status.name} and can no longer be edited. Reopen it first.`,
      });
    }

    if (!hasChanges(existing, parsed.data)) {
      return res.json({ success: true, message: "No changes are found" });
    }

    const {
      file_number,
      bank_id,
      business_type_id,
      branch_id: bodyBranchId,
    } = parsed.data;

    const noFileNumberChange =
      file_number === undefined || file_number === existing.file_number;
    const noBankChange = bank_id === undefined || bank_id === existing.bank_id;
    const noBusinessTypeChange =
      business_type_id === undefined ||
      business_type_id === existing.business_type_id;

    // A coordinator only sees their own business line, so letting them move a
    // case out of it would hide the case from them permanently with no way to
    // undo. Branch admin sees every business type in the branch and can move it
    // back, so the change is theirs to make.
    if (!noBusinessTypeChange && scope.tier === CASE_SCOPE.BUSINESS_TYPE) {
      return res.status(403).json({
        success: false,
        message: "Only a branch admin can move a case to another business type",
      });
    }

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
    if (!noBranchChange && scope.tier !== CASE_SCOPE.ALL) {
      return res.status(403).json({
        success: false,
        message: "You cannot reassign a case to another branch",
      });
    }

    // Business types are unique per branch, so the new one is looked up scoped
    // to the branch the case will end up in — another branch's "national" is a
    // different row, and accepting it would leave the case matching nobody's
    // scope.
    let targetBusinessTypeId = existing.business_type_id;
    if (!noBusinessTypeChange) {
      const businessType = await getBusinessTypeById(
        business_type_id,
        targetBranchId,
      );
      if (
        respondIfInvalidParent(res, businessType, {
          label: "Business type",
          action: "move cases into it",
        })
      )
        return;
      targetBusinessTypeId = business_type_id;
    }

    // File numbers are unique per branch AND business type, so re-check
    // whenever any of the three changes, against the values the row will end up
    // with rather than the ones it has now.
    if (!noFileNumberChange || !noBranchChange || !noBusinessTypeChange) {
      const targetFileNumber = noFileNumberChange
        ? existing.file_number
        : file_number;
      const duplicate = await findCaseByFileNumber(
        targetFileNumber,
        targetBranchId,
        targetBusinessTypeId,
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

    const caseRecord = await updateCaseService(id, data, actor);

    logAuthEvent("case_updated", {
      case_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
      ...(noBranchChange
        ? {}
        : { from_branch_id: existing.branch_id, to_branch_id: targetBranchId }),
      ...(noBankChange
        ? {}
        : { from_bank_id: existing.bank_id, to_bank_id: bank_id }),
      // Logged explicitly: this one changes which coordinators can see the case.
      ...(noBusinessTypeChange
        ? {}
        : {
            from_business_type_id: existing.business_type_id,
            to_business_type_id: targetBusinessTypeId,
          }),
    });

    res.json({
      success: true,
      message: "Case updated successfully",
      data: formatCaseResponse(caseRecord),
    });
  } catch (error) {
    // A concurrent write slipped past the duplicate check above; the composite
    // @@unique is what actually closes the window.
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
