import { getCaseById } from "../services/service.getById.case.js";
import { assignCase as assignCaseService } from "../services/service.assign.case.js";
import { getUserByEmployeeId } from "../../users/services/service.getByEmployeeId.js";
import { findStatusByCode } from "../../status/services/service.getStatusByCode.js";
import { assignCaseSchema } from "../case.schema.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { resolveCaseScope } from "../../../utils/case-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { STATUS_CODE } from "../../../constant/case-status.js";
import {
  createCaseIdentitySnapshot,
  formatCaseResponse,
} from "../utils/case-history.js";

// Assignment has its own endpoint rather than riding on the generic update: it
// advances the status, and it changes who can see the case at all. Burying that
// in a field write would make both effects invisible in the audit trail.
export const assignCase = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    const parsed = assignCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const actor = createCaseIdentitySnapshot(req.user);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    const { employee_id } = parsed.data;

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
        message: "Case is soft-deleted; restore it before assigning",
      });
    }

    if (existing.status?.is_terminal) {
      return res.status(409).json({
        success: false,
        message: `Case is ${existing.status.name} and can no longer be assigned.`,
      });
    }

    if (existing.employee_id === employee_id) {
      return res.json({
        success: true,
        message: "Case is already assigned to this employee",
      });
    }

    const assignedUser = await getUserByEmployeeId(employee_id);
    if (
      respondIfInvalidParent(res, assignedUser, {
        label: "Employee",
        action: "assign cases to them",
      })
    )
      return;

    // A case's employee must always belong to the case's branch, or the
    // assignment would hand an engineer in another branch a case they are not
    // allowed to see.
    if (assignedUser.branch_id !== existing.branch_id) {
      return res.status(409).json({
        success: false,
        message: "Assigned employee does not belong to this branch",
      });
    }

    // Assigning an `open` case advances it in the same write, so an assigned
    // case can never be left sitting at `open`. A reassignment mid-flow keeps
    // the status it already has.
    const isReassignment = Boolean(existing.employee_id);
    const shouldAdvance =
      !isReassignment && existing.status?.code === STATUS_CODE.OPEN;

    let nextStatus = null;
    if (shouldAdvance) {
      nextStatus = await findStatusByCode(STATUS_CODE.ASSIGNED_TO_ENGINEER);
      if (!nextStatus || nextStatus.deleted_at) {
        console.error(
          "assignCase error: assigned_to_engineer status is missing — run `npm run seed`",
        );
        return res.status(500).json({
          success: false,
          message:
            "Case statuses are not configured. Contact your administrator.",
        });
      }
    }

    const caseRecord = await assignCaseService(
      id,
      {
        employee_id,
        statusId: nextStatus?.id,
        statusCode: nextStatus?.code,
        previousStatusCode: existing.status?.code,
        isReassignment,
      },
      actor,
    );

    logAuthEvent(isReassignment ? "case_reassigned" : "case_assigned", {
      case_id: id,
      from_employee_id: existing.employee_id ?? null,
      to_employee_id: employee_id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: isReassignment
        ? "Case reassigned successfully"
        : "Case assigned successfully",
      data: formatCaseResponse(caseRecord),
    });
  } catch (error) {
    console.error("assignCase error:", error);
    res.status(500).json({ success: false, message: "Failed to assign case" });
  }
};
