import { findRoleByName } from "../services/service.findByName.role.js";
import { createRole as createRoleService } from "../services/service.create.role.js";
import { getDepartmentById } from "../../departments/services/service.getById.department.js";
import { roleSchema } from "../role.schema.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createRoleHistoryEntry,
  formatRoleResponse,
} from "../utils/role-history.js";

export const createRole = async (req, res) => {
  try {
    const parsed = roleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { name, department_id, branch_id: bodyBranchId } = parsed.data;

    const department = await getDepartmentById(department_id);
    if (
      respondIfInvalidParent(res, department, {
        label: "Department",
        action: "assign new roles to it",
      })
    )
      return;

    const branch_id = bodyBranchId || department.branch_id;

    const existing = await findRoleByName(name, department_id);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Role already exists in this department",
      });
    }

    const historyEntry = createRoleHistoryEntry("CREATE", req.user);
    const role = await createRoleService(
      name,
      department_id,
      branch_id,
      historyEntry,
    );

    logAuthEvent("role_created", {
      role_id: role.id,
      branch_id,
      department_id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });
    res.status(201).json({ success: true, data: formatRoleResponse(role) });
  } catch (error) {
    console.error("createRole error:", error);
    res.status(500).json({ success: false, message: "Failed to create role" });
  }
};
