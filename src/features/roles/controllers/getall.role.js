import { getAllRoles as getAllRolesService } from "../services/service.getall.role.js";
import { formatRoleResponse } from "../utils/role-history.js";

export const getAllRoles = async (req, res) => {
  try {
    const { direction, cursorId } = req.query;

    const {
      roles,
      roleFirstId,
      roleLastId,
      hasNextPage,
      hasPreviousPage,
      roleLength,
      dataLimit,
    } = await getAllRolesService({ direction, cursorId });
    res.json({
      success: true,
      data: formatRoleResponse(roles),
      roleFirstId,
      roleLastId,
      hasNextPage,
      hasPreviousPage,
      roleLength,
      dataLimit,
    });
  } catch (error) {
    console.error("getAllRoles error:", error);

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch roles";
    res.status(status).json({ success: false, message });
  }
};
