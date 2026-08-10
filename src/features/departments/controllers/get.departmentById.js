import { getDepartmentById as getDepartmentByIdService } from "../services/service.getById.department.js";

export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await getDepartmentByIdService(id);

    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    res.json({ success: true, data: department });
  } catch (error) {
    console.error("getDepartmentById error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch department" });
  }
};
