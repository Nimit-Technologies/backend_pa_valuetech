import { getUserByEmployeeId } from "../services/service.getByEmployeeId.js";
import { createUser as createUserService } from "../services/service.create.user.js";
import { userSchema } from "../user.schema.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { getDepartmentById } from "../../departments/services/service.getById.department.js";
import { getRoleById } from "../../roles/services/service.getById.role.js";
import bcrypt from "bcrypt";
import { CREDENTIALS } from "../../../constant/credentials.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";

export const createUser = async (req, res) => {
  try {
    const { confirm_password } = req.body;

    if (!confirm_password) {
      return res
        .status(400)
        .json({ success: false, message: "Confirm password is required" });
    }
    if (req.body.password !== confirm_password) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      password,
      aadhaar_number,
      branch_id,
      department_id,
      role_id,
      address,
    } = parsed.data;

    const existing = await getUserByEmployeeId(employee_id);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "User with this employee ID already exists",
      });
    }

    const [branch, department, role] = await Promise.all([
      getBranchById(branch_id),
      getDepartmentById(department_id),
      getRoleById(role_id),
    ]);

    if (
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "assign new users to it",
      })
    )
      return;
    if (
      respondIfInvalidParent(res, department, {
        label: "Department",
        action: "assign new users to it",
      })
    )
      return;
    if (
      respondIfInvalidParent(res, role, {
        label: "Role",
        action: "assign new users to it",
      })
    )
      return;

    const hashedPassword = await bcrypt.hash(password, CREDENTIALS.SALT_ROUNDS);

    const user = await createUserService({
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      password: hashedPassword,
      aadhaar_number,
      branch_id,
      department_id,
      role_id,
      address,
    });

    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      console.error(
        `createUser error: user with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`,
      );
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }
    if (error?.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Branch, department, or role not found",
      });
    }
    console.error("createUser error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
