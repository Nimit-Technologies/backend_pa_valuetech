import { getDepartmentById } from "../services/service.getById.department.js";
import { restoreDepartment as restoreDepartmentService } from "../services/service.restore.department.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";

export const restoreDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getDepartmentById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        if (!existing.deleted_at) {
            return res.status(409).json({ success: false, message: "Department is not soft-deleted" });
        }

        const branch = await getBranchById(existing.branch_id);
        if (respondIfInvalidParent(res, branch, { label: "Branch", action: "restore this department" })) return;

        const department = await restoreDepartmentService(id);
        res.json({ success: true, message: "Department restored successfully", data: department });
    } catch (error) {
        console.error("restoreDepartment error:", error);
        res.status(500).json({ success: false, message: "Failed to restore department" });
    }
};
