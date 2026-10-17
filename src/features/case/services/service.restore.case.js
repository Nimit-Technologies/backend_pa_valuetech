import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";
import {
  clearedDeletedBySnapshotFields,
  createCaseHistoryEntry,
} from "../utils/case-history.js";

// The deleted_by_* snapshot is cleared along with deleted_at: it describes the
// delete that is being undone, so leaving it behind would make a live case look
// deleted. The restore itself stays on record as a history entry.
//
// The status is left as it was — a restored case resumes where it stopped.
export const restoreCase = async (id, actor) => {
  const caseRecord = await prisma.case.update({
    where: { id },
    data: {
      deleted_at: null,
      ...clearedDeletedBySnapshotFields(),
      update_history: {
        create: createCaseHistoryEntry(actor, { action: "restore" }),
      },
    },
    include: caseInclude,
  });

  return shapeCase(caseRecord);
};
