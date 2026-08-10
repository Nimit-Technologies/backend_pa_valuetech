import { findRoleByName } from "../services/service.findByName.role.js";
import { createRole as createRoleService } from "../services/service.create.role.js";
import { getDepartmentById } from "../../departments/services/service.getById.department.js";
import { roleSchema } from "../role.schema.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";

export const createRole = async (req, res) => {
  try {
    const parsed = roleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { name, department_id } = parsed.data;

    const department = await getDepartmentById(department_id);
    if (
      respondIfInvalidParent(res, department, {
        label: "Department",
        action: "assign new roles to it",
      })
    )
      return;

    const existing = await findRoleByName(name, department_id);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Role already exists in this department",
      });
    }

    const role = await createRoleService(name, department_id);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    console.error("createRole error:", error);
    res.status(500).json({ success: false, message: "Failed to create role" });
  }
};
