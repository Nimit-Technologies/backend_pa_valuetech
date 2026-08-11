import { getUserById as getUserByIdService } from "../services/service.getById.user.js";

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("getUserById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};
