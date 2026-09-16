import { getAllDepartments as getAllDepartmentsService } from "../services/service.getall.department.js";
import { formatDepartmentResponse } from "../utils/department-history.js";

export const getAllDepartments = async (req, res) => {
  try {
    const { direction, cursorId, search } = req.query;

    const {
      departments,
      departmentFirstId,
      departmentLastId,
      hasNextPage,
      hasPreviousPage,
      departmentLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    } = await getAllDepartmentsService({ direction, cursorId, search });

    res.json({
      success: true,
      data: formatDepartmentResponse(departments),
      departmentFirstId,
      departmentLastId,
      hasNextPage,
      hasPreviousPage,
      departmentLength,
      dataLimit,
      totalCount,
      totalActiveCount,
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
