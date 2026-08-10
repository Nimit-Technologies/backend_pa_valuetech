import { getUserById } from "../services/service.getById.user.js";
import { softDeleteUser as softDeleteUserService } from "../services/service.softDelete.user.js";

export const softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getUserById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "User is already deleted" });
    }

    const user = await softDeleteUserService(id);
    res.json({
      success: true,
      message: "User soft-deleted successfully",
      data: user,
    });
  } catch (error) {
    console.error("softDeleteUser error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to soft-delete user" });
  }
};
