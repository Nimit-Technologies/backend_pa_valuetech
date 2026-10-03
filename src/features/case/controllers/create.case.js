import { findCaseByFileNumber } from "../services/service.findByFileNumber.case.js";
import { createCase as createCaseService } from "../services/service.create.case.js";
import { getBankById } from "../../banks/services/service.getById.bank.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { getBusinessTypeById } from "../../business_type/services/service.get.business-typeById.js";
import { getUserByEmployeeId } from "../../users/services/service.getByEmployeeId.js";
import { caseSchema } from "../case.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createCaseIdentitySnapshot,
  formatCaseResponse,
} from "../utils/case-history.js";
import { SCOPED_DUPLICATE_MESSAGES } from "../utils/case-duplicate-messages.js";

export const createCase = async (req, res) => {
  try {
    const parsed = caseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    // created_by_id is required and immutable, so a case cannot be opened
    // without an identifiable actor to attribute it to.
    const actor = createCaseIdentitySnapshot(req.user);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    const {
      file_number,
      bank_id,
      business_type_id,
      employee_id,
      branch_id: bodyBranchId,
    } = parsed.data;

    const bank = await getBankById(bank_id);
    if (
      respondIfInvalidParent(res, bank, {
        label: "Bank",
        action: "open new cases under it",
      })
    )
      return;

    // A case's branch follows the branch of the bank it is filed under. The
    // client may assert it, but it is re-derived here rather than trusted.
    if (bodyBranchId && bodyBranchId !== bank.branch_id) {
      return res.status(409).json({
        success: false,
        message: "Bank does not belong to the given branch",
      });
    }
    const branch_id = bank.branch_id;

    const scope = resolveBranchScope(req);
    if (scope && branch_id !== scope) {
      return res.status(403).json({
        success: false,
        message: "You can only create cases for your own branch",
      });
    }

    const [branch, businessType, assignedUser] = await Promise.all([
      getBranchById(branch_id),
      getBusinessTypeById(business_type_id),
      getUserByEmployeeId(employee_id),
    ]);

    if (
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "assign new cases to it",
      })
    )
      return;

    if (
      respondIfInvalidParent(res, businessType, {
        label: "Business type",
        action: "assign new cases to it",
      })
    )
      return;

    if (
      respondIfInvalidParent(res, assignedUser, {
        label: "Employee",
        action: "assign new cases to them",
      })
    )
      return;

    // getUserByEmployeeId returns the raw row, so the branch comes back as the
    // branch_id scalar rather than a nested relation.
    if (assignedUser.branch_id !== branch_id) {
      return res.status(409).json({
        success: false,
        message: "Assigned employee does not belong to this branch",
      });
    }

    const existing = await findCaseByFileNumber(file_number, branch_id);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: SCOPED_DUPLICATE_MESSAGES.file_number,
      });
    }

    const caseRecord = await createCaseService(
      { ...parsed.data, branch_id },
      actor,
    );

    logAuthEvent("case_created", {
      case_id: caseRecord.id,
      file_number,
      branch_id,
      bank_id,
      business_type_id,
      employee_id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res
      .status(201)
      .json({ success: true, data: formatCaseResponse(caseRecord) });
  } catch (error) {
    // A concurrent create slipped past the findCaseByFileNumber check above —
    // only reachable once (file_number, branch_id) is a unique index.
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      const scopedMessage = SCOPED_DUPLICATE_MESSAGES[field];
      if (scopedMessage) {
        console.error(`createCase error: ${scopedMessage}`);
        return res.status(409).json({ success: false, message: scopedMessage });
      }
      return res
        .status(409)
        .json({ success: false, message: "Case already exists" });
    }
    console.error("createCase error:", error);
    res.status(500).json({ success: false, message: "Failed to create case" });
  }
};
