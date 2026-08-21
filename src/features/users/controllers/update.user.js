import { getUserById } from "../services/service.getById.user.js";
import { getUserByEmployeeId } from "../services/service.getByEmployeeId.js";
import { updateUser as updateUserService } from "../services/service.update.user.js";
import { updateUserSchema } from "../user.schema.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { getDepartmentById } from "../../departments/services/service.getById.department.js";
import { getRoleById } from "../../roles/services/service.getById.role.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { UNIQUE_FIELD_LABELS } from "../../../utils/unique-field-labels.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import bcrypt from "bcrypt";
import { CREDENTIALS } from "../../../constant/credentials.js";

// True if `data` (only the keys the caller actually sent, since
// updateUserSchema fields are all optional) would change anything on
// `existing`. getUserById selects branch/department/role as nested relation
// objects rather than flat *_id scalars, so those three compare against
// `.id`. A password is never compared to the stored hash — its mere
// presence means the caller intends to change it. Keeps a no-op PUT from
// hitting the DB or re-triggering downstream effects (updated_at bump,
// token_version bump/session invalidation, audit log, etc.).
const hasChanges = (existing, data) =>
  Object.entries(data).some(([key, value]) => {
    if (key === "password") return true;
    if (key === "confirm_password") return false;
    if (key === "address") {
      if (!value || typeof value !== "object") return false;
      return Object.entries(value).some(
        ([addrKey, addrValue]) => existing.address?.[addrKey] !== addrValue,
      );
    }
    if (key === "branch_id") return existing.branch?.id !== value;
    if (key === "department_id") return existing.department?.id !== value;
    if (key === "role_id") return existing.role?.id !== value;
    return existing[key] !== value;
  });

export const updateUser = async (req, res, next) => {
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

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const existing = await getUserById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "User is soft-deleted; restore it before updating",
      });
    }

    if (!hasChanges(existing, parsed.data)) {
      return res.json({ success: true, message: "No changes are found" });
    }

    const {
      employee_id,
      branch_id,
      department_id,
      role_id,
      password,
      confirm_password,
      ...updateData
    } = parsed.data;

    // Only hit the DB for a duplicate if employee_id is actually changing —
    // excludes this user's own row.
    if (employee_id !== undefined && employee_id !== existing.employee_id) {
      const duplicate = await getUserByEmployeeId(employee_id, id);
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "User with this employee ID already exists",
        });
      }
      updateData.employee_id = employee_id;
    }

    if (password) {
      if (password !== confirm_password) {
        return res
          .status(400)
          .json({ success: false, message: "Passwords do not match" });
      }
      updateData.password = await bcrypt.hash(
        password,
        CREDENTIALS.SALT_ROUNDS,
      );
    }

    const [branch, department, role] = await Promise.all([
      branch_id ? getBranchById(branch_id) : null,
      department_id ? getDepartmentById(department_id) : null,
      role_id ? getRoleById(role_id) : null,
    ]);

    if (
      branch_id &&
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "reassign user to it",
      })
    )
      return;
    if (
      department_id &&
      respondIfInvalidParent(res, department, {
        label: "Department",
        action: "reassign user to it",
      })
    )
      return;
    if (
      role_id &&
      respondIfInvalidParent(res, role, {
        label: "Role",
        action: "reassign user to it",
      })
    )
      return;

    const user = await updateUserService(id, {
      ...updateData,
      branch_id,
      department_id,
      role_id,
    });

    logAuthEvent("user_updated", {
      user_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, data: user });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      console.error(
        `updateUser error: user with this ${UNIQUE_FIELD_LABELS[field] ?? field} already exists`,
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
    console.error("updateUser error:", error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};
