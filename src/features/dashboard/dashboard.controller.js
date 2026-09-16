import { getSuperAdminSummary } from "./dashboard.service.js";

// GET /api/v1/dashboard/super-admin
export const getSuperAdminDashboard = async (req, res) => {
  try {
    const summary = await getSuperAdminSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("getSuperAdminDashboard error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load dashboard summary" });
  }
};
