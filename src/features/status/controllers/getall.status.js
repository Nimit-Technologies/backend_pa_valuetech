import { getAllStatuses as getAllStatusesService } from "../services/service.getall.status.js";

export const getAllStatuses = async (req, res) => {
  try {
    const status = await getAllStatusesService();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error("getAllStatuses error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch statuses" });
  }
};
