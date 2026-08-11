import { getDepartmentById } from "../services/service.getById.department.js";
import { findDepartmentByName } from "../services/service.findByName.department.js";
import { updateDepartment as updateDepartmentService } from "../services/service.update.department.js";
import { updateDepartmentSchema } from "../department.schema.js";

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (name) {
      const duplicate = await findDepartmentByName(name, existing.branch_id);
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({
          success: false,
          message: "Department with this name already exists in this branch",
        });
      }
    }

    const noNameChange = name === undefined || name === existing.name;
    const noActiveChange =
      is_active === undefined || is_active === existing.is_active;
    if (noNameChange && noActiveChange) {
      return res.json({ success: true, message: "No changes are found" });
    }

    const department = await updateDepartmentService(id, parsed.data);
    res.json({ success: true, data: department });
  } catch (error) {
    console.error("updateDepartment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update department" });
  }
};
