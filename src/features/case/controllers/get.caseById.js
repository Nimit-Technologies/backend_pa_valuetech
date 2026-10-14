import { getCaseById as getCaseByIdService } from "../services/service.getById.case.js";
import { respondIfInvalidIdParam } from "../../../utils/validate-id-param.js";
import { resolveCaseScope } from "../../../utils/case-scope.js";
import { formatCaseResponse } from "../utils/case-history.js";

export const getCaseById = async (req, res, next) => {
  try {
    if (respondIfInvalidIdParam(req, res, next)) return;
    const { id } = req.params;

    const scope = resolveCaseScope(req);
    const { business_type_id: _businessTypeId, ...scopeWhere } = scope.where;

    const caseRecord = await getCaseByIdService(id, scopeWhere);

    if (!caseRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    res.json({ success: true, data: formatCaseResponse(caseRecord) });
  } catch (error) {
    console.error("getCaseById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch case" });
  }
};
