import prisma from "../../../prisma/client.js";

// Cases currently assigned to this user and still in flight.
//
// Deliberately much narrower than getUserDependents, which blocks a *hard*
// delete and reaches cases six ways including created_by and update-history.
// Those relations are immutable and permanent, so reusing that check here would
// mean anyone who ever created a case could never be deactivated — nobody could
// ever be offboarded.
//
// "Holds a case" therefore means currently assigned AND not finished: a
// terminal status (close / cancelled) no longer blocks anything, which matters
// because employee_id is never cleared and an engineer accumulates every case
// they have ever worked.
export const getActiveCaseLoad = (userId) => {
  return prisma.case.findMany({
    where: {
      employee: { id: userId },
      deleted_at: null,
      status: { is_terminal: false },
    },
    select: {
      id: true,
      file_number: true,
      status: { select: { code: true, name: true } },
    },
  });
};

// Shared by every path that would take a user out of service — the is_active
// toggle, the soft delete, a branch move, and the generic update when it
// carries is_active or branch_id. Returns true when it has already answered.
export const respondIfHoldingActiveCases = async (res, userId, action) => {
  const cases = await getActiveCaseLoad(userId);
  if (!cases.length) return false;

  res.status(409).json({
    success: false,
    message: `Cannot ${action}: ${cases.length} active case(s) are still assigned to this user. Reassign them first.`,
    data: cases.map(({ id, file_number, status }) => ({
      id,
      file_number,
      status: status?.name ?? null,
    })),
  });
  return true;
};
