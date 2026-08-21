import { getRoleById } from "../services/service.getById.role.js";
import { deleteRole as deleteRoleService } from "../services/service.delete.role.js";
import { getRoleDependents } from "../services/service.checkDependents.role.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
export const deleteRole = async (req, res, next) => {
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
    const existing = await getRoleById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    const { users } = await getRoleDependents(id);
    if (users.length) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete role: user(s) still exist for this role",
        data: users.map((u) => ({
          type: "user",
          id: u.id,
          name: `${u.first_name} ${u.last_name}`,
        })),
      });
    }

    await deleteRoleService(id);
    logAuthEvent("role_deleted", {
      role_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });
    res.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    if (error?.code === "P2003" || error?.code === "P2014") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete role: it is still assigned to one or more users",
      });
    }
    console.error("deleteRole error:", error);
    res.status(500).json({ success: false, message: "Failed to delete role" });
  }
};
