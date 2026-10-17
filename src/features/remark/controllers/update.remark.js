import { updateRemarkSchema } from "../remark.schema.js";
import { getRemarkById } from "../services/service.getById.remark.js";
import { updateRemark as updateRemarkService } from "../services/service.update.remark.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { resolveRemarkBranchScope } from "../utils/remark-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const updateRemark = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    const parsed = updateRemarkSchema.safeParse(req.body);
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

    const existing = await getRemarkById(id);

    const branchScope = resolveRemarkBranchScope(req);
    const outOfBranch =
      branchScope && existing?.case?.branch_id !== branchScope;

    if (!existing || outOfBranch) {
      return res
        .status(404)
        .json({ success: false, message: "Remark not found" });
    }

    // Author-only. Reading a remark is branch-wide, but editing one is not:
    // there is no moderation path, so the author is the only person who can
    // correct their own words.
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own remarks",
      });
    }

    if (existing.case?.status?.is_terminal) {
      return res.status(409).json({
        success: false,
        message: `Case is ${existing.case.status.name}; its remarks can no longer be edited`,
      });
    }

    if (existing.content === parsed.data.content) {
      return res.json({ success: true, message: "No changes are found" });
    }

    const remark = await updateRemarkService(id, parsed.data.content);

    logAuthEvent("remark_updated", {
      remark_id: id,
      case_id: existing.case_id,
      actor_id: req.user.id,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Remark updated successfully",
      data: remark,
    });
  } catch (error) {
    console.error("updateRemark error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update remark" });
  }
};
