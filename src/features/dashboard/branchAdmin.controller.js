import { getBranchAdminSummary } from "./branchAdmin.service.js";

// GET /api/v1/dashboard/branch-admin
export const getBranchAdminDashboard = async (req, res) => {
  try {
    const summary = await getBranchAdminSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("getBranchAdminDashboard error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load dashboard summary" });
  }
};
