import { getBranchById } from "../services/service.getById.branch.js";
import { deleteBranch as deleteBranchService } from "../services/service.delete.branch.js";
import { getBranchDependents } from "../services/service.checkDependents.branch.js";

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getBranchById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    const { departments, users, banks, roles } = await getBranchDependents(id);
    if (departments.length || users.length || banks.length || roles.length) {
      const blockers = [];
      if (departments.length) blockers.push("department(s)");
      if (roles.length) blockers.push("role(s)");
      if (users.length) blockers.push("user(s)");
      if (banks.length) blockers.push("bank(s)");

      const data = [
        ...departments.map((d) => ({
          type: "department",
          id: d.id,
          name: d.name,
        })),
        ...roles.map((r) => ({ type: "role", id: r.id, name: r.name })),
        ...users.map((u) => ({
          type: "user",
          id: u.id,
          name: `${u.first_name} ${u.last_name}`,
        })),
        ...banks.map((b) => ({ type: "bank", id: b.id, name: b.name })),
      ];

      return res.status(409).json({
        success: false,
        message: `Cannot delete branch: ${blockers.join(", ")} still exist for this branch`,
        data,
      });
    }

    await deleteBranchService(id);
    res.json({ success: true, message: "Branch deleted successfully" });
  } catch (error) {
    if (error?.code === "P2003" || error?.code === "P2014") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete branch: it is still assigned to one or more departments, roles, users, or banks",
      });
    }
    console.error("deleteBranch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete branch" });
  }
};
