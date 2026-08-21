import { getRoleById } from "../services/service.getById.role.js";
import { findRoleByName } from "../services/service.findByName.role.js";
import { updateRole as updateRoleService } from "../services/service.update.role.js";
import { updateRoleSchema } from "../role.schema.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const updateRole = async (req, res, next) => {
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

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const existing = await getRoleById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Role is soft-deleted; restore it before updating",
      });
    }

    const { name, is_active } = parsed.data;

    // Was previously `name`-only, so a body of just `{ is_active }` silently
    // no-opped (returned "No changes are found" without ever calling
    // updateRoleService) — check every field the schema actually accepts.
    const noNameChange = name === undefined || name === existing.name;
    const noActiveChange =
      is_active === undefined || is_active === existing.is_active;
    if (noNameChange && noActiveChange) {
      return res.json({ success: true, message: "No changes are found" });
    }

    // Only hit the DB for a duplicate if the name is actually changing —
    // scoped to the same department, same as create, and excludes this
    // role's own row so re-saving the current name isn't flagged.
    if (!noNameChange) {
      const duplicate = await findRoleByName(name, existing.department_id);
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({
          success: false,
          message: "Role with this name already exists in this department",
        });
      }
    }

    const role = await updateRoleService(id, parsed.data);

    logAuthEvent("role_updated", {
      role_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, data: role });
  } catch (error) {
    console.error("updateRole error:", error);
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
};
