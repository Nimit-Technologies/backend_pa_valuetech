import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";
import { createCaseHistoryEntry } from "../utils/case-history.js";
import { recordCaseTransition } from "../utils/case-count.js";

// `existing` is the row as it was before this write (the controller already
// fetched it); it supplies the "before" side of the count transition. `actor`
// is the identity snapshot of the authenticated user, appended to the case's
// update history.
export const setCaseStatus = async (id, is_active, actor, existing) => {
  const historyEntry = createCaseHistoryEntry(actor);

  const caseRecord = await prisma.case.update({
    where: { id },
    data: {
      is_active,
      ...(historyEntry && { update_history: { create: historyEntry } }),
    },
    include: caseInclude,
  });

  recordCaseTransition(existing, caseRecord);
  return shapeCase(caseRecord);
};
