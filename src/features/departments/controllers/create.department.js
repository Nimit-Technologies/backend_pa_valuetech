import { findDepartmentByName } from "../services/service.findByName.department.js";
import { createDepartment as createDepartmentService } from "../services/service.create.department.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { departmentSchema } from "../department.schema.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createDepartmentHistoryEntry,
  formatDepartmentResponse,
} from "../utils/department-history.js";

export const createDepartment = async (req, res) => {
  try {
    const parsed = departmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { name, branch_id } = parsed.data;
    const branch = await getBranchById(branch_id);
    if (
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "assign new departments to it",
      })
    )
      return;

    const existing = await findDepartmentByName(name, branch_id);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Department already exists in this branch",
      });
    }

    const historyEntry = createDepartmentHistoryEntry("CREATE", req.user);
    const department = await createDepartmentService(
      name,
      branch_id,
      historyEntry,
    );

    logAuthEvent("department_created", {
      department_id: department.id,
      branch_id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res
      .status(201)
      .json({ success: true, data: formatDepartmentResponse(department) });
  } catch (error) {
    console.error("createDepartment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create department" });
  }
};
