import { getRoleById as getRoleByIdService } from "../services/service.getById.role.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { formatRoleResponse } from "../utils/role-history.js";

export const getRoleById = async (req, res, next) => {
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
    const role = await getRoleByIdService(id);

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    res.json({ success: true, data: formatRoleResponse(role) });
  } catch (error) {
    console.error("getRoleById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch role" });
  }
};
