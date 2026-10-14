import { getAllStatuses as getAllStatusesService } from "../services/service.getall.status.js";
import { isSuperAdminRole } from "../../../middlewares/authorize.js";
import { formatStatusResponse } from "../utils/status-response.js";

// {{BASE_URL}}/status/all-status?search=""&include_deleted=false
export const getAllStatuses = async (req, res) => {
  try {
    const { search, include_deleted } = req.query;

    // Readable by every role (statuses drive the workflow dropdowns), but
    // only a super admin may list soft-deleted rows — for anyone else they
    // are deleted, and the flag is ignored rather than refused.
    const includeDeleted =
      isSuperAdminRole(req) && String(include_deleted) === "true";

    const { statuses, statusLength, totalCount, totalActiveCount } =
      await getAllStatusesService({ search, includeDeleted });

    res.json({
      success: true,
      data: formatStatusResponse(statuses),
      statusLength,
      totalCount,
      totalActiveCount,
    });
  } catch (error) {
    console.error("getAllStatuses error:", error);
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch statuses";
    res.status(status).json({ success: false, message });
  }
};
