import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";
import {
  createCaseHistoryEntry,
  deletedBySnapshotFields,
} from "../utils/case-history.js";
import { recordCaseTransition } from "../utils/case-count.js";

// `existing` is the row as it was before this write (the controller already
// fetched it); it supplies the "before" side of the count transition. `actor`
// is the identity snapshot of the authenticated user, written to the
// deleted_by_* columns and appended to the update history.
export const softDeleteCase = async (id, actor, existing) => {
  const historyEntry = createCaseHistoryEntry(actor);

  const caseRecord = await prisma.case.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      is_active: false,
      ...deletedBySnapshotFields(actor),
      ...(historyEntry && { update_history: { create: historyEntry } }),
    },
    include: caseInclude,
  });

  // The row leaves the counted set: total -1, active -1 if it was active.
  recordCaseTransition(existing, caseRecord);
  return shapeCase(caseRecord);
};
