import { getUserById } from "../services/service.getById.user.js";
import { restoreUser as restoreUserService } from "../services/service.restore.user.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { getDepartmentById } from "../../departments/services/service.getById.department.js";
import { getRoleById } from "../../roles/services/service.getById.role.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";

export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getUserById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "User is not soft-deleted" });
    }

    const [branch, department, role] = await Promise.all([
      getBranchById(existing.branch_id),
      getDepartmentById(existing.department_id),
      getRoleById(existing.role_id),
    ]);

    if (
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "restore this user",
      })
    )
      return;
    if (
      respondIfInvalidParent(res, department, {
        label: "Department",
        action: "restore this user",
      })
    )
      return;
    if (
      respondIfInvalidParent(res, role, {
        label: "Role",
        action: "restore this user",
      })
    )
      return;

    const user = await restoreUserService(id);
    res.json({
      success: true,
      message: "User restored successfully",
      data: user,
    });
  } catch (error) {
    console.error("restoreUser error:", error);
    res.status(500).json({ success: false, message: "Failed to restore user" });
  }
};
