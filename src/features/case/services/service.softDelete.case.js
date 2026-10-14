import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";
import {
  createCaseHistoryEntry,
  deletedBySnapshotFields,
} from "../utils/case-history.js";

// `actor` is written to the deleted_by_* columns and appended to the history.
// The status is left untouched: soft-delete hides a case entered in error, it
// is not a lifecycle outcome. Cancelling is the way to record a case that
// existed and ended.
//
// updated_by_* is not written — this is not a data edit.
export const softDeleteCase = async (id, actor) => {
  const caseRecord = await prisma.case.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      ...deletedBySnapshotFields(actor),
      update_history: {
        create: createCaseHistoryEntry(actor, { action: "soft_delete" }),
      },
    },
    include: caseInclude,
  });

  return shapeCase(caseRecord);
};
