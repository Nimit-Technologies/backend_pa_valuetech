// Once an engineer submits the site-visit report for their assignment, the
// case's status is no longer theirs to move — the report is frozen
// (saveMyReport refuses edits) and the case is in coordination's hands.
//
// Keyed on the engineer's LATEST allocation for the case, not on any report
// they ever submitted: a reassign appends a new allocation (sequence is
// max+1), so an engineer handed the case again starts a fresh, unlocked task.
//
// Prisma is imported lazily (as in engineer.report.js) so engineer.helpers.js,
// which pulls in isReportSubmitted, stays importable without a database.
export const hasSubmittedReportForCase = async ({ caseId, userId }) => {
  const { default: prisma } = await import("../../../prisma/client.js");
  const allocation = await prisma.allocation.findFirst({
    where: { case_id: caseId, user_id: userId },
    orderBy: { sequence: "desc" },
    select: { site_visit_report: { select: { isDraft: true } } },
  });

  return isReportSubmitted(allocation?.site_visit_report);
};

export const isReportSubmitted = (report) =>
  Boolean(report) && report.isDraft === false;
