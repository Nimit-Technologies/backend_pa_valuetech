import { getUserById }                    from "../services/service.getById.user.js";
import { updateUser as updateUserService } from "../services/service.update.user.js";
import { updateUserSchema }               from "../user.schema.js";
import { getBranchById }     from "../../branch/services/service.getById.branch.js";
import { getDepartmentById } from "../../departments/services/service.getById.department.js";
import { getRoleById }       from "../../roles/services/service.getById.role.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import bcrypt from "bcrypt";
import { CREDENTIALS } from "../../../constant/credentials.js";

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }

    const existing = await getUserById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({ success: false, message: "User is soft-deleted; restore it before updating" });
    }

    const { branch_id, department_id, role_id, password, confirm_password, ...updateData } = parsed.data;

    if (password) {
      if (password !== confirm_password) {
        return res.status(400).json({ success: false, message: "Passwords do not match" });
      }
      updateData.password = await bcrypt.hash(password, CREDENTIALS.SALT_ROUNDS);
    }

    const [branch, department, role] = await Promise.all([
      branch_id ? getBranchById(branch_id) : null,
      department_id ? getDepartmentById(department_id) : null,
      role_id ? getRoleById(role_id) : null,
    ]);

    if (branch_id && respondIfInvalidParent(res, branch, { label: "Branch", action: "reassign user to it" })) return;
    if (department_id && respondIfInvalidParent(res, department, { label: "Department", action: "reassign user to it" })) return;
    if (role_id && respondIfInvalidParent(res, role, { label: "Role", action: "reassign user to it" })) return;

    const user = await updateUserService(id, { ...updateData, branch_id, department_id, role_id });
    res.json({ success: true, data: user });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      console.error(`updateUser error: user with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`);
      return res.status(409).json({ success: false, message: "User already exists" });
    }
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Branch, department, or role not found" });
    }
    console.error("updateUser error:", error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};
