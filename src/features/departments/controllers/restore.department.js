import { getDepartmentById } from "../services/service.getById.department.js";
import { restoreDepartment as restoreDepartmentService } from "../services/service.restore.department.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createDepartmentHistoryEntry,
  formatDepartmentResponse,
} from "../utils/department-history.js";

export const restoreDepartment = async (req, res, next) => {
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

    const existing = await getDepartmentById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    if (!existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Department is not soft-deleted" });
    }

    const branch = await getBranchById(existing.branch_id);
    if (
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "restore this department",
      })
    )
      return;

    const historyEntry = createDepartmentHistoryEntry("RESTORE", req.user);
    const department = await restoreDepartmentService(
      id,
      historyEntry,
      existing.history,
    );

    logAuthEvent("department_restored", {
      department_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Department restored successfully",
      data: formatDepartmentResponse(department),
    });
  } catch (error) {
    console.error("restoreDepartment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to restore department" });
  }
};
