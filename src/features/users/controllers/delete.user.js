import { getUserById } from "../services/service.getById.user.js";
import { deleteUser as deleteUserService } from "../services/service.delete.user.js";
import { getUserDependents } from "../services/service.checkDependents.user.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

export const deleteUser = async (req, res, next) => {
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

    const existing = await getUserById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { cases, allocations } = await getUserDependents(id);
    if (cases.length || allocations.length) {
      const blockers = [];
      if (cases.length) blockers.push("case(s)");
      if (allocations.length) blockers.push("allocation(s)");

      const data = [
        ...cases.map((c) => ({
          type: "case",
          id: c.id,
          name: c.file_number,
        })),
        ...allocations.map((a) => ({
          type: "allocation",
          id: a.id,
          name: a.file_number ?? "",
        })),
      ];

      return res.status(409).json({
        success: false,
        message: `Cannot delete user: ${blockers.join(", ")} still exist for this user`,
        data,
      });
    }

    await deleteUserService(id);

    logAuthEvent("user_deleted", {
      user_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    if (error?.code === "P2003" || error?.code === "P2014") {
      return res.status(409).json({
        success: false,
        message: "Cannot delete user: it is still referenced by other records",
      });
    }
    console.error("deleteUser error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};
