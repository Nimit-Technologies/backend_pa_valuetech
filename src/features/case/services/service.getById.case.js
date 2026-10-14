import prisma from "../../../prisma/client.js";
import {
  caseDetailInclude,
  REMARK_PREVIEW_LIMIT,
  shapeCase,
} from "./case.service.helpers.js";
import { shapeRemark } from "../../remark/services/remark.service.helpers.js";

// `scopeWhere` comes from resolveCaseScope and is applied in the query itself,
// so a case outside the caller's scope is never fetched and then discarded — it
// simply does not exist for them, and the controller reports a plain 404 rather
// than a 403 that would confirm it exists.
//
// Remarks ride along on the detail view. No separate scope check is needed:
// resolveCaseScope is strictly tighter than resolveRemarkBranchScope, so a
// caller who can read the case could already read its remarks through
// `GET /remark/:caseId`.
export const getCaseById = async (id, scopeWhere = {}) => {
  const caseRecord = await prisma.case.findFirst({
    where: { id, ...scopeWhere },
    include: caseDetailInclude,
  });

  if (!caseRecord) return caseRecord;

  // The extra row fetched by remarkPreview answers "is there more?" and is then
  // dropped, so the client never sees a page longer than the limit.
  const { remarks, ...rest } = caseRecord;

  return {
    ...shapeCase(rest),
    remarks: remarks.slice(0, REMARK_PREVIEW_LIMIT).map(shapeRemark),
    has_more_remarks: remarks.length > REMARK_PREVIEW_LIMIT,
  };
};
