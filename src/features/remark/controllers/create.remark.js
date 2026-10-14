import { remarkSchema } from "../remark.schema.js";
import { getUserById } from "../../users/services/service.getById.user.js";
import { getCaseForRemark } from "../services/service.getCase.remark.js";
import { createRemark as createRemarkService } from "../services/service.create.remark.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { resolveRemarkBranchScope } from "../utils/remark-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const createRemark = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const caseId = req.params.id;

    const parsed = remarkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    const { content } = parsed.data;

    const branchScope = resolveRemarkBranchScope(req);
    const caseRecord = await getCaseForRemark(caseId, branchScope);
    if (!caseRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    if (caseRecord.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Case is deleted; it cannot be commented on",
      });
    }

    // A closed or cancelled case is frozen, remarks included — otherwise a
    // finished case could be annotated indefinitely after delivery.
    if (caseRecord.status?.is_terminal) {
      return res.status(409).json({
        success: false,
        message: `Case is ${caseRecord.status.name} and can no longer be commented on`,
      });
    }

    // Snapshot the author's identity as of right now, from the session rather
    // than the request body — a client-supplied user_id would let anyone post a
    // remark attributed to someone else, and editing is gated on authorship.
    const author = await getUserById(req.user.id);
    if (!author) {
      return res.status(401).json({
        success: false,
        message: "Your account is no longer available. Please log in again.",
      });
    }

    const remark = await createRemarkService({
      content,
      case_id: caseRecord.id,
      user_id: author.id,
      branch_id: author.branch.id,
      department_id: author.department.id,
      role_id: author.role.id,
      first_name: author.first_name,
      employee_id: author.employee_id,
      branch_name: author.branch.name,
      department_name: author.department.name,
      role_name: author.role.name,
    });

    logAuthEvent("remark_created", {
      remark_id: remark.id,
      case_id: caseRecord.id,
      actor_id: req.user.id,
      ip: req.ip,
      success: true,
    });

    res.status(201).json({ success: true, data: remark });
  } catch (error) {
    console.error("createRemark error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create remark" });
  }
};
