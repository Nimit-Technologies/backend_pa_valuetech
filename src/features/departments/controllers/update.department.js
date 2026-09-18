import { getDepartmentById } from "../services/service.getById.department.js";
import { findDepartmentByName } from "../services/service.findByName.department.js";
import { updateDepartment as updateDepartmentService } from "../services/service.update.department.js";
import { updateDepartmentSchema } from "../department.schema.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createDepartmentHistoryEntry,
  formatDepartmentResponse,
} from "../utils/department-history.js";

export const updateDepartment = async (req, res, next) => {
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

    const { name, is_active, branch_id } = parsed.data;

    const noNameChange = name === undefined || name === existing.name;
    const noActiveChange =
      is_active === undefined || is_active === existing.is_active;
    const noBranchChange =
      branch_id === undefined || branch_id === existing.branch_id;
    if (noNameChange && noActiveChange && noBranchChange) {
      return res.json({ success: true, message: "No changes are found" });
    }

    // A move must land in a branch that exists and is live, exactly like
    // assigning a branch on create.
    if (!noBranchChange) {
      const branch = await getBranchById(branch_id);
      if (
        respondIfInvalidParent(res, branch, {
          label: "Branch",
          action: "move departments into it",
        })
      )
        return;
    }

    // Names are unique per branch, so re-check whenever the name OR the
    // branch changes, against the values the row will end up with.
    if (!noNameChange || !noBranchChange) {
      const targetName = noNameChange ? existing.name : name;
      const targetBranchId = noBranchChange ? existing.branch_id : branch_id;
      const duplicate = await findDepartmentByName(targetName, targetBranchId);
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({
          success: false,
          message: "Department with this name already exists in this branch",
        });
      }
    }

    const historyEntry = createDepartmentHistoryEntry("UPDATE", req.user);
    const department = await updateDepartmentService(
      id,
      parsed.data,
      historyEntry,
      existing,
    );

    logAuthEvent("department_updated", {
      department_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
      ...(noBranchChange
        ? {}
        : { from_branch_id: existing.branch_id, to_branch_id: branch_id }),
    });

    res.json({
      success: true,
      message: "Department updated successfully",
      data: formatDepartmentResponse(department),
    });
  } catch (error) {
    // `name` is globally unique at the DB level; a concurrent write slipped
    // past the duplicate check above.
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Department with this name already exists",
      });
    }
    console.error("updateDepartment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update department" });
  }
};
