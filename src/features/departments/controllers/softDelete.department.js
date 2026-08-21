import { getDepartmentById } from "../services/service.getById.department.js";
import { softDeleteDepartment as softDeleteDepartmentService } from "../services/service.softDelete.department.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const softDeleteDepartment = async (req, res, next) => {
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
      return res
        .status(409)
        .json({ success: false, message: "Department is already deleted" });
    }

    const department = await softDeleteDepartmentService(id);

    logAuthEvent("department_soft_deleted", {
      department_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Department soft-deleted successfully",
      data: department,
    });
  } catch (error) {
    console.error("softDeleteDepartment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to soft-delete department" });
  }
};
