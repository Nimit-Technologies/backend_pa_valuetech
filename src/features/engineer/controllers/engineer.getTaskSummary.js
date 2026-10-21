import { countMyTasks } from "../services/engineer.countMyTasks.js";

const resolveActor = (req) => ({
  userId: req.user?.id,
  branchId: req.user?.branch?.id,
});

const SESSION_EXPIRED = {
  success: false,
  message: "Your session has expired. Please log in again.",
};

export const getMyTaskSummary = async (req, res) => {
  try {
    const { userId, branchId } = resolveActor(req);
    if (!userId || !branchId) return res.status(401).json(SESSION_EXPIRED);

    const summary = await countMyTasks({ userId, branchId });

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("getMyTaskSummary error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch your task summary" });
  }
};
