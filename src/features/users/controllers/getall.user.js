import { getAllUsers as getAllUsersService } from "../services/service.getall.user.js";

export const getAllUsers = async (req, res) => {
  try {
    const { direction, cursorId } = req.query;

    const {
      users,
      userFirstId,
      userLastId,
      hasNextPage,
      hasPreviousPage,
      userLength,
      dataLimit,
    } = await getAllUsersService({ direction, cursorId });

    res.json({
      success: true,
      data: users,
      userFirstId,
      userLastId,
      hasNextPage,
      hasPreviousPage,
      userLength,
      dataLimit,
    });
  } catch (error) {
    
    console.error("getAllUsers error:", error);

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch users";
    res.status(status).json({ success: false, message });
  }
};
