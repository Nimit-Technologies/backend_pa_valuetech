import { getAllUsers as getAllUsersService } from "../services/service.getall.user.js";

export const getAllUsers = async (req, res) => {
  try {
    const take = Math.min(parseInt(req.query.limit) || 20, 100);
    const cursor = req.query.cursor || undefined;

    const users = await getAllUsersService({ take, cursor });
    const nextCursor =
      users.length === take ? users[users.length - 1].id : null;

    res.json({ success: true, data: users, nextCursor });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};
