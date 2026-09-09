import { getDepartmentById } from "../services/service.getById.department.js";
import { findDepartmentByName } from "../services/service.findByName.department.js";
import { updateDepartment as updateDepartmentService } from "../services/service.update.department.js";
import { updateDepartmentSchema } from "../department.schema.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createDepartmentHistoryEntry,
  formatDepartmentResponse,
} from "../utils/department-history.js";

export const updateDepartment = async (req, res, next) => {
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

    const parsed = updateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
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
        message: "Department is soft-deleted; restore it before updating",
      });
    }

    const { name, is_active } = parsed.data;

    const noNameChange = name === undefined || name === existing.name;
    const noActiveChange =
      is_active === undefined || is_active === existing.is_active;
    if (noNameChange && noActiveChange) {
      return res.json({ success: true, message: "No changes are found" });
    }

    // Only hit the DB for a duplicate if the name is actually changing —
    // scoped to the same branch, excludes this department's own row.
    if (!noNameChange) {
      const duplicate = await findDepartmentByName(name, existing.branch_id);
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({
          success: false,
          message: "Department with this name already exists in this branch",
        });
      }
    }

    const historyEntry = createDepartmentHistoryEntry("UPDATE", req.user);
    const department = await updateDepartmentService(
      id,
      parsed.data,
      historyEntry,
      existing.history,
    );

    logAuthEvent("department_updated", {
      department_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, data: formatDepartmentResponse(department) });
  } catch (error) {
    console.error("updateDepartment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update department" });
  }
};
