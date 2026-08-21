import { getAllDepartments as getAllDepartmentsService } from "../services/service.getall.department.js";

export const getAllDepartments = async (req, res) => {
  try {
    const { direction, cursorId } = req.query;
    const {
      departments,
      departmentFirstId,
      departmentLastId,
      hasNextPage,
      hasPreviousPage,
      departmentLength,
      dataLimit,
    } = await getAllDepartmentsService({ direction, cursorId });
    res.json({
      success: true,
      data: departments,
      departmentFirstId,
      departmentLastId,
      hasNextPage,
      hasPreviousPage,
      departmentLength,
      dataLimit,
    });
  } catch (error) {
    console.error("getAllDepartments error:", error);
    const status = error.status || 500;
    const message = error.status
      ? error.message
      : "Failed to fetch departments";
    res.status(status).json({ success: false, message });
  }
};
