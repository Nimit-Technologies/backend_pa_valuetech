import { getAllBusinessTypes as getAllBusinessTypesService } from "../services/service.getall.business-type.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";

export const getAllBusinessTypes = async (req, res) => {
  try {
    const { direction, cursorId } = req.query;
    // A super admin has no branch scope of their own, so let them narrow the
    // list to one branch explicitly — the user create/update forms need a
    // single branch's types to choose from, and business types are unique per
    // branch. A branch-scoped caller's own scope still wins (it is a truthy
    // branch id, or the impossible NO_BRANCH_SCOPE sentinel), so this cannot
    // be used to read another branch's business types.
    const scope = resolveBranchScope(req);
    const branchId = scope ?? (req.query.branchId || undefined);
    const {
      businessTypes,
      businessTypeFirstId,
      businessTypeLastId,
      hasNextPage,
      hasPreviousPage,
      businessTypeLength,
      dataLimit,
    } = await getAllBusinessTypesService({ direction, cursorId, branchId });

    res.json({
      success: true,
      data: businessTypes,
      businessTypeFirstId,
      businessTypeLastId,
      hasNextPage,
      hasPreviousPage,
      businessTypeLength,
      dataLimit,
    });
  } catch (error) {
    console.error("getAllBusinessTypes error:", error);
    const status = error.status || 500;
    const message = error.status
      ? error.message
      : "Failed to fetch business types";
    res.status(status).json({ success: false, message });
  }
};
