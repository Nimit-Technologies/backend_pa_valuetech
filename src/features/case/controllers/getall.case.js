import { getAllCases as getAllCasesService } from "../services/service.getall.case.js";
import { resolveCaseScope } from "../../../utils/case-scope.js";
import { formatCaseResponse } from "../utils/case-history.js";

export const getAllCases = async (req, res) => {
  try {
    const { direction, cursorId, search, status, include_finished } = req.query;

    // Branch admin sees their branch, a coordinator their own business type
    // within it, an engineer only the cases assigned to them.
    const scope = resolveCaseScope(req);

    const {
      cases,
      caseFirstId,
      caseLastId,
      hasNextPage,
      hasPreviousPage,
      caseLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    } = await getAllCasesService({
      direction,
      cursorId,
      search,
      scopeWhere: scope.where,
      statusCode: status,
      includeFinished: include_finished === "true",
    });

    res.json({
      success: true,
      data: formatCaseResponse(cases),
      caseFirstId,
      caseLastId,
      hasNextPage,
      hasPreviousPage,
      caseLength,
      dataLimit,
      totalCount,
      totalActiveCount,
    });
  } catch (error) {
    console.error("getAllCases error:", error);

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch cases";
    res.status(status).json({ success: false, message });
  }
};
