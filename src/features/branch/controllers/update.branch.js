import { getBranchById } from "../services/service.getById.branch.js";
import { updateBranch as updateBranchService } from "../services/service.update.branch.js";
import { branchSchema } from "../branch.schema.js";

export const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;

        const parsed = branchSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.issues });
        }

        const { name } = parsed.data;

        const existing = await getBranchById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Branch not found" });
        }

        if (existing.deleted_at) {
            return res.status(409).json({ success: false, message: "Branch is soft-deleted; restore it before updating" });
        }

        if (existing.name === name) {
            return res.json({ success: true, message: "No changes are found" });
        }

        const branch = await updateBranchService(id, name);
        res.json({ success: true, data: branch });
    } catch (error) {
        console.error("updateBranch error:", error);
        res.status(500).json({ success: false, message: "Failed to update branch" });
    }
};
