import { getCaseById } from "../services/service.getById.case.js";
import { transitionCase as transitionCaseService } from "../services/service.transition.case.js";
import { findStatusByCode } from "../../status/services/service.getStatusByCode.js";
import { transitionCaseSchema } from "../case.schema.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { resolveCaseScope } from "../../../utils/case-scope.js";
import { roleName } from "../../../middlewares/authorize.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { STATUS_CODE } from "../../../constant/case-status.js";
import {
  checkTransition,
  checkCancelReversal,
  resolveCancelReversalTarget,
  TRANSITION_DENIED,
} from "../utils/case-transition-rules.js";
import {
  createCaseIdentitySnapshot,
  formatCaseResponse,
} from "../utils/case-history.js";

const DENIAL_RESPONSE = {
  [TRANSITION_DENIED.NO_SUCH_EDGE]: {
    status: 409,
    message: "That status change is not allowed from the case's current status",
  },
  [TRANSITION_DENIED.ROLE_NOT_ALLOWED]: {
    status: 403,
    message: "Your role is not allowed to make that status change",
  },
  [TRANSITION_DENIED.REASON_REQUIRED]: {
    status: 400,
    message: "A reason is required for that status change",
  },
};

// The one endpoint every role shares. Engineers reach the case only through
// their own assignments (resolveCaseScope), and what they may do with it is
// decided by the transition rules rather than by a route-level role guard —
// an engineer may move visit_schedule -> visit_in_progress but not
// report_completed -> close, which no single middleware can express.
export const transitionCase = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    const parsed = transitionCaseSchema.safeParse(req.body);
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

    const {
      status: requestedCode,
      reason,
      cancellation_reason: cancellationReason,
    } = parsed.data;

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
        message: "Case is soft-deleted; restore it before changing status",
      });
    }

    const fromCode = existing.status?.code;
    const role = roleName(req);

    // Reversing a cancellation is not a free choice of target — the case
    // returns to whatever it was cancelled from, read back from the history.
    // A client may send that code or omit it; either way the target is derived.
    const isCancelReversal =
      fromCode === STATUS_CODE.CANCELLED &&
      requestedCode !== STATUS_CODE.CANCELLED;

    const targetCode = isCancelReversal
      ? resolveCancelReversalTarget(existing.update_history)
      : requestedCode;

    const verdict = isCancelReversal
      ? checkCancelReversal({ role, reason })
      : checkTransition({
          from: fromCode,
          to: targetCode,
          role,
          reason,
          isTerminalFrom: Boolean(existing.status?.is_terminal),
        });

    if (!verdict.ok) {
      const { status, message } = DENIAL_RESPONSE[verdict.denied];
      return res.status(status).json({ success: false, message });
    }

    if (targetCode === STATUS_CODE.CANCELLED && !cancellationReason) {
      return res.status(400).json({
        success: false,
        message: "A cancellation category is required to cancel a case",
      });
    }

    const toStatus = await findStatusByCode(targetCode);
    if (!toStatus || toStatus.deleted_at || !toStatus.is_active) {
      return res.status(409).json({
        success: false,
        message: "Target status is not available",
      });
    }

    const caseRecord = await transitionCaseService(
      id,
      { fromCode, toStatus, reason, cancellationReason },
      actor,
    );

    logAuthEvent("case_status_changed", {
      case_id: id,
      from_status: fromCode,
      to_status: toStatus.code,
      reason: reason ?? null,
      cancellation_reason: cancellationReason ?? null,
      actor_id: req.user?.id ?? null,
      actor_role: role,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: `Case moved to ${toStatus.name}`,
      data: formatCaseResponse(caseRecord),
    });
  } catch (error) {
    console.error("transitionCase error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to change case status" });
  }
};
