import { getUserById } from "../services/service.getById.user.js";
import { deleteUser as deleteUserService } from "../services/service.delete.user.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidCuid(id)) {
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

    await deleteUserService(id);
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
