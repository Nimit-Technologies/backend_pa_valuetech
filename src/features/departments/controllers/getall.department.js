import { getAllDepartments as getAllDepartmentsService } from "../services/service.getall.department.js";

export const getAllDepartments = async (req, res) => {
  try {
    const departments = await getAllDepartmentsService();
    console.log(departments);
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error("getAllDepartments error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch departments" });
  }
};
