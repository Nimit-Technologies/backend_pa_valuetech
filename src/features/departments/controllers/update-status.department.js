import { getDepartmentById } from "../services/service.getById.department.js";
import { setDepartmentStatus } from "../services/service.updateStatus.department.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createDepartmentHistoryEntry,
  formatDepartmentResponse,
} from "../utils/department-history.js";

export const updateDepartmentStatus = async (req, res, next) => {
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

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message:
          "Department is soft-deleted; restore it before changing status",
      });
    }

    const is_active = !existing.is_active;
    const historyEntry = createDepartmentHistoryEntry(
      is_active ? "ACTIVATE" : "DEACTIVATE",
      req.user,
    );
    const department = await setDepartmentStatus(
      id,
      is_active,
      historyEntry,
      existing.history,
    );

    logAuthEvent(
      is_active ? "department_activated" : "department_deactivated",
      {
        department_id: id,
        actor_id: req.user?.id ?? null,
        ip: req.ip,
        success: true,
      },
    );

    res.json({
      success: true,
      message: `Department ${is_active ? "activated" : "deactivated"} successfully`,
      data: formatDepartmentResponse(department),
    });
  } catch (error) {
    console.error("updateDepartmentStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update department status" });
  }
};
