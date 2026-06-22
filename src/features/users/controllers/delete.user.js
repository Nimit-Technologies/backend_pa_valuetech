import { getUserById }                   from "../services/service.getById.user.js";
import { deleteUser as deleteUserService } from "../services/service.delete.user.js";

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getUserById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await deleteUserService(id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};
