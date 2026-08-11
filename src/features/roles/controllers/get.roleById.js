import { getRoleById as getRoleByIdService } from "../services/service.getById.role.js";

export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await getRoleByIdService(id);

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    res.json({ success: true, data: role });
  } catch (error) {
    console.error("getRoleById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch role" });
  }
};
