import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";
import {
  clearedDeletedBySnapshotFields,
  createCaseHistoryEntry,
} from "../utils/case-history.js";
import { recordCaseTransition } from "../utils/case-count.js";

// The deleted_by_* snapshot is cleared along with deleted_at: it describes the
// delete that is being undone, so leaving it behind would make a live case
// look deleted. The restore itself stays on record as an update-history entry.
export const restoreCase = async (id, actor, existing) => {
  const historyEntry = createCaseHistoryEntry(actor);

  const caseRecord = await prisma.case.update({
    where: { id },
    data: {
      deleted_at: null,
      is_active: true,
      ...clearedDeletedBySnapshotFields(),
      ...(historyEntry && { update_history: { create: historyEntry } }),
    },
    include: caseInclude,
  });

  // The row re-enters the counted set as active: total +1, active +1.
  recordCaseTransition(existing, caseRecord);
  return shapeCase(caseRecord);
};
