import { findBranchByName } from "../services/service.findByName.branch.js";
import { createBranch as createBranchService } from "../services/service.create.branch.js";
import { branchSchema } from "../branch.schema.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createBranchHistoryEntry,
  formatBranchResponse,
} from "../utils/branch-history.js";

export const createBranch = async (req, res) => {
  try {
    const parsed = branchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { name } = parsed.data;

    const existing = await findBranchByName(name);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Branch already exists" });
    }

    const historyEntry = createBranchHistoryEntry("CREATE", req.user);
    const branch = await createBranchService(name, historyEntry);

    logAuthEvent("branch_created", {
      branch_id: branch.id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.status(201).json({ success: true, data: formatBranchResponse(branch) });
  } catch (error) {
    console.error("createBranch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create branch" });
  }
};
