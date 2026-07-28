import { findBranchByName } from "../services/service.findByName.branch.js";
import { createBranch as createBranchService } from "../services/service.create.branch.js";
import { branchSchema } from "../branch.schema.js";

export const createBranch = async (req, res) => {
    try {
        const parsed = branchSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.issues });
        }

        const { name } = parsed.data;

        const existing = await findBranchByName(name);
        if (existing) {
            return res.status(409).json({ success: false, message: "Branch already exists" });
        }

        const branch = await createBranchService(name);
        res.status(201).json({ success: true, data: branch });
    } catch (error) {
        console.error("createBranch error:", error);
        res.status(500).json({ success: false, message: "Failed to create branch" });
    }
};
