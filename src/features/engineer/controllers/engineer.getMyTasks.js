import { listMyTasks } from "../services/engineer.listMyTasks.js";
import { myTaskQuerySchema } from "../engineer.schema.js";

const resolveActor = (req) => ({
  userId: req.user?.id,
  branchId: req.user?.branch?.id,
});

const SESSION_EXPIRED = {
  success: false,
  message: "Your session has expired. Please log in again.",
};

export const getMyTasks = async (req, res) => {
  try {
    const { userId, branchId } = resolveActor(req);
    if (!userId || !branchId) return res.status(401).json(SESSION_EXPIRED);

    const parsed = myTaskQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const { direction, cursorId, search, status } = parsed.data;

    const {
      tasks,
      taskFirstId,
      taskLastId,
      hasNextPage,
      hasPreviousPage,
      taskLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    } = await listMyTasks({
      userId,
      branchId,
      direction,
      cursorId,
      search,
      statusCode: status,
    });

    res.json({
      success: true,
      data: tasks,
      taskFirstId,
      taskLastId,
      hasNextPage,
      hasPreviousPage,
      taskLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    });
  } catch (error) {
    console.error("getMyTasks error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch your tasks" });
  }
};
