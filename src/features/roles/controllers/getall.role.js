import { getAllRoles as getAllRolesService } from "../services/service.getall.role.js";

export const getAllRoles = async (req, res) => {
  try {
    const roles = await getAllRolesService();
    res.json({ success: true, data: roles });
  } catch (error) {
    console.error("getAllRoles error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch roles" });
  }
};
