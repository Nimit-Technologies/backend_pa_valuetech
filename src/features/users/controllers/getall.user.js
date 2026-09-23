import { getAllUsers as getAllUsersService } from "../services/service.getall.user.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { formatUserResponse } from "../utils/user-history.js";

export const getAllUsers = async (req, res) => {
  try {
    const { direction, cursorId, search } = req.query;
    // A non-super-admin only ever sees users in their own branch.
    const branchId = resolveBranchScope(req);

    const {
      users,
      userFirstId,
      userLastId,
      hasNextPage,
      hasPreviousPage,
      userLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    } = await getAllUsersService({ direction, cursorId, search, branchId });

    res.json({
      success: true,
      data: formatUserResponse(users),
      userFirstId,
      userLastId,
      hasNextPage,
      hasPreviousPage,
      userLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    });
  } catch (error) {
    console.error("getAllUsers error:", error);

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch users";
    res.status(status).json({ success: false, message });
  }
};
