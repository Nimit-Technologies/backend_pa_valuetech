import { getAllRoles as getAllRolesService } from "../services/service.getall.role.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { formatRoleResponse } from "../utils/role-history.js";

export const getAllRoles = async (req, res) => {
  try {
    const { direction, cursorId, search } = req.query;
    // A non-super-admin only ever sees roles in their own branch.
    const branchId = resolveBranchScope(req);

    const {
      roles,
      roleFirstId,
      roleLastId,
      hasNextPage,
      hasPreviousPage,
      roleLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    } = await getAllRolesService({ direction, cursorId, search, branchId });
    res.json({
      success: true,
      data: formatRoleResponse(roles),
      roleFirstId,
      roleLastId,
      hasNextPage,
      hasPreviousPage,
      roleLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    });
  } catch (error) {
    console.error("getAllRoles error:", error);

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch roles";
    res.status(status).json({ success: false, message });
  }
};
