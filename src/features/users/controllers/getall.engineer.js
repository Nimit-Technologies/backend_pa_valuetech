import { getAllEngineers as getAllEngineersService } from "../services/service.getall.engineer.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { findBranchByName } from "../../branch/services/service.findByName.branch.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { resolveEngineerBranch } from "../utils/engineer-branch-scope.js";

export const getAllEngineers = async (req, res) => {
  try {
    const { direction, cursorId, search, branch_id, branch } = req.query;

    // null for a super admin (every branch), the caller's own branch id for
    // everyone else, or a sentinel that matches nothing for a session with no
    // branch at all.
    const scopedBranchId = resolveBranchScope(req);

    const requestedId = String(branch_id ?? "").trim();
    const requestedName = String(branch ?? "").trim();
    const named = requestedId || requestedName;

    let namedBranch = null;
    if (named) {
      namedBranch = requestedId
        ? await getBranchById(requestedId)
        : await findBranchByName(requestedName);
    }

    const {
      branchId,
      branch: resolvedBranch,
      error,
    } = resolveEngineerBranch({
      scopedBranchId,
      ownBranch: req.user?.branch,
      named,
      namedBranch,
    });

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const {
      engineers,
      userFirstId,
      userLastId,
      hasNextPage,
      hasPreviousPage,
      userLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    } = await getAllEngineersService({
      direction,
      cursorId,
      search,
      branchId,
    });

    res.json({
      success: true,

      data: engineers,
      userFirstId,
      userLastId,
      hasNextPage,
      hasPreviousPage,
      userLength,
      dataLimit,
      totalCount,
      totalActiveCount,

      branch: resolvedBranch,
    });
  } catch (error) {
    console.error("getAllEngineers error:", error);

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch engineers";
    res.status(status).json({ success: false, message });
  }
};
