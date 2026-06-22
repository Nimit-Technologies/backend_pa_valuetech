import { z } from "zod";
import { getDepartmentById }                      from "../services/service.getById.department.js";
import { findDepartmentByName }                   from "../services/service.findByName.department.js";
import { updateDepartment as updateDepartmentService } from "../services/service.update.department.js";

const updateDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const parsed = updateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }

    const { name } = parsed.data;

    const existing = await getDepartmentById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const duplicate = await findDepartmentByName(name, existing.branch_id);
    if (duplicate && duplicate.id !== id) {
      return res.status(409).json({ success: false, message: "Department with this name already exists in this branch" });
    }

    const department = await updateDepartmentService(id, name);
    res.json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update department" });
  }
};
