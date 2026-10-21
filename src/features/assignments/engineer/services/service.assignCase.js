import prisma from "../../../../prisma/client.js";
import {
  caseInclude,
  shapeCase,
} from "../../../case/services/case.service.helpers.js";
import {
  createCaseHistoryEntry,
  updatedBySnapshotFields,
} from "../../../case/utils/case-history.js";

// Assigns or reassigns the engineer.
//
// `statusId`/`statusCode` are supplied only when the assignment also advances
// the lifecycle — an `open` case moving to `assigned_to_engineer`. A
// reassignment leaves the status where it is, so the work already done is not
// discarded.
//
// employee_id is case data, so this does write the updated_by_* snapshot.
export const assignCase = async (
  id,
  { employee_id, statusId, statusCode, previousStatusCode, isReassignment },
  actor,
) => {
  const caseRecord = await prisma.case.update({
    where: { id },
    data: {
      employee: { connect: { employee_id } },
      ...(statusId && { status: { connect: { id: statusId } } }),
      ...updatedBySnapshotFields(actor),
      update_history: {
        create: createCaseHistoryEntry(actor, {
          action: isReassignment ? "reassign" : "assign",
          from: previousStatusCode,
          to: statusCode ?? previousStatusCode,
        }),
      },
    },
    include: caseInclude,
  });

  return shapeCase(caseRecord);
};
