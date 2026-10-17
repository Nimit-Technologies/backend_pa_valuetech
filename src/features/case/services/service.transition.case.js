import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";
import { createCaseHistoryEntry } from "../utils/case-history.js";
import { STATUS_CODE } from "../../../constant/case-status.js";

// Moves a case to a new status.
//
// Deliberately does NOT write the updated_by_* snapshot: that records the last
// change to the case's *data*, and a status move is not one. The actor is
// recorded on the history row instead.
//
// `closed_at` tracks the most recent close and is cleared on reopen, so it can
// answer date-range reporting without scanning the history. `cancellation_reason`
// follows the same current-state rule.
export const transitionCase = async (
  id,
  { fromCode, toStatus, reason, cancellationReason },
  actor,
) => {
  const isClosing = toStatus.code === STATUS_CODE.CLOSE;
  const isCancelling = toStatus.code === STATUS_CODE.CANCELLED;
  const leavingTerminal =
    fromCode === STATUS_CODE.CLOSE || fromCode === STATUS_CODE.CANCELLED;

  const caseRecord = await prisma.case.update({
    where: { id },
    data: {
      status: { connect: { id: toStatus.id } },
      ...(isClosing && { closed_at: new Date() }),
      ...(isCancelling && { cancellation_reason: cancellationReason ?? null }),
      ...(leavingTerminal && { closed_at: null, cancellation_reason: null }),
      update_history: {
        create: createCaseHistoryEntry(actor, {
          action: "status_change",
          from: fromCode,
          to: toStatus.code,
          reason: reason ?? null,
        }),
      },
    },
    include: caseInclude,
  });

  return shapeCase(caseRecord);
};
