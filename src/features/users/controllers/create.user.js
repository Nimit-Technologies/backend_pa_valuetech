import { getUserByEmployeeId } from "../services/service.getByEmployeeId.js";
import { createUser as createUserService } from "../services/service.create.user.js";
import { userSchema } from "../user.schema.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { getDepartmentById } from "../../departments/services/service.getById.department.js";
import { getRoleById } from "../../roles/services/service.getById.role.js";
import { hashPassword } from "../utils/password.util.js";
import { encrypt, blindIndex } from "../../../utils/encryption.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createUserHistoryEntry,
  formatUserResponse,
} from "../utils/user-history.js";

export const createUser = async (req, res) => {
  try {
    const { confirm_password } = req.body;

    if (!req.body.password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }
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

    const hashedPassword = await hashPassword(password);

    const historyEntry = createUserHistoryEntry("CREATE", req.user);
    const user = await createUserService(
      {
        employee_id,
        first_name,
        last_name,
        email,
        phone,
        password: hashedPassword,
        // Store Aadhaar encrypted; the blind index carries uniqueness.
        aadhaar_number: encrypt(aadhaar_number),
        aadhaar_hash: blindIndex(aadhaar_number),
        branch_id,
        department_id,
        role_id,
        address,
      },
      historyEntry,
    );

    logAuthEvent("user_created", {
      user_id: user.id,
      employee_id: user.employee_id,
      branch_id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    return res
      .status(201)
      .json({ success: true, data: formatUserResponse(user) });
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
