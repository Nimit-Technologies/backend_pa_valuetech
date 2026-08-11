import { getDepartmentById } from "../services/service.getById.department.js";
import { deleteDepartment as deleteDepartmentService } from "../services/service.delete.department.js";
import { getDepartmentDependents } from "../services/service.checkDependents.department.js";

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getDepartmentById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    const { users, roles } = await getDepartmentDependents(id);
    if (users.length || roles.length) {
      const blockers = [];
      if (roles.length) blockers.push("role(s)");
      if (users.length) blockers.push("user(s)");

      const data = [
        ...roles.map((r) => ({ type: "role", id: r.id, name: r.name })),
        ...users.map((u) => ({
          type: "user",
          id: u.id,
          name: `${u.first_name} ${u.last_name}`,
        })),
      ];

      return res.status(409).json({
        success: false,
        message: `Cannot delete department: ${blockers.join(", ")} still exist for this department`,
        data,
      });
    }

    await deleteDepartmentService(id);
    res.json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    if (error?.code === "P2003" || error?.code === "P2014") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete department: it is still assigned to one or more users or roles",
      });
    }
    console.error("deleteDepartment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete department" });
  }
};
