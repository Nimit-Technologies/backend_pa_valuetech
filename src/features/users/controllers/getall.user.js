import { getAllUsers as getAllUsersService } from "../services/service.getall.user.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};
