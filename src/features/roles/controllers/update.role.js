import { getRoleById } from "../services/service.getById.role.js";
import { findRoleByName } from "../services/service.findByName.role.js";
import { updateRole as updateRoleService } from "../services/service.update.role.js";
import { getDepartmentById } from "../../departments/services/service.getById.department.js";
import { updateRoleSchema } from "../role.schema.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createRoleHistoryEntry,
  formatRoleResponse,
} from "../utils/role-history.js";

export const updateRole = async (req, res, next) => {
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

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const existing = await getRoleById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Role is soft-deleted; restore it before updating",
      });
    }

    const { name, is_active, department_id } = parsed.data;

    // Check every field the schema accepts; a body of just `{ is_active }`
    // or just `{ department_id }` must still count as a change.
    const noNameChange = name === undefined || name === existing.name;
    const noActiveChange =
      is_active === undefined || is_active === existing.is_active;
    const noDepartmentChange =
      department_id === undefined || department_id === existing.department_id;
    if (noNameChange && noActiveChange && noDepartmentChange) {
      return res.json({ success: true, message: "No changes are found" });
    }

    const data = { ...parsed.data };

    // A move must land in a department that exists and is live, exactly like
    // assigning a department on create. The role's branch always follows its
    // department's branch, so it is re-derived here rather than trusted from
    // the client.
    if (!noDepartmentChange) {
      const department = await getDepartmentById(department_id);
      if (
        respondIfInvalidParent(res, department, {
          label: "Department",
          action: "move roles into it",
        })
      )
        return;
      data.branch_id = department.branch_id;
    }

    // Names are unique per department, so re-check whenever the name OR the
    // department changes, against the values the row will end up with.
    if (!noNameChange || !noDepartmentChange) {
      const targetName = noNameChange ? existing.name : name;
      const targetDepartmentId = noDepartmentChange
        ? existing.department_id
        : department_id;
      const duplicate = await findRoleByName(targetName, targetDepartmentId);
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({
          success: false,
          message: "Role with this name already exists in this department",
        });
      }
    }

    const historyEntry = createRoleHistoryEntry("UPDATE", req.user);
    const role = await updateRoleService(id, data, historyEntry, existing);

    logAuthEvent("role_updated", {
      role_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
      ...(noDepartmentChange
        ? {}
        : {
            from_department_id: existing.department_id,
            to_department_id: department_id,
            from_branch_id: existing.branch_id,
            to_branch_id: data.branch_id,
          }),
    });

    res.json({
      success: true,
      message: "Role updated successfully",
      data: formatRoleResponse(role),
    });
  } catch (error) {
    // Unique (name, department_id) index — a concurrent write slipped past
    // the duplicate check above.
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Role with this name already exists in this department",
      });
    }
    console.error("updateRole error:", error);
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
};
