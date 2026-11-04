import { AppError } from "../../../utils/app-error.js";

// Same ownership check findMyReport/saveMyReport use: the task (Allocation)
// must belong to this engineer, in a non-deleted case within their branch.
// site_visit_report.isDraft is pulled along so callers that need to block
// edits to a submitted report don't have to query it separately.
const resolveMyAllocation = async (
  client,
  { taskId, userId, employeeId, branchId },
) => {
  const allocation = await client.allocation.findFirst({
    where: {
      id: taskId,
      user_id: userId,
      case: {
        deleted_at: null,
        employee_id: employeeId,
        branch_id: branchId,
      },
    },
    select: {
      id: true,
      case_id: true,
      site_visit_report: { select: { isDraft: true } },
    },
  });

  if (!allocation) {
    throw new AppError("Task not found", 404);
  }

  return allocation;
};

export const formatAssetResponse = (asset) => ({
  id: asset.id,
  photoType: asset.photo_type,
  employeeId: asset.employee_id,
  objectUrl: asset.object_url,
  objectID: asset.object_id,
  objectName: asset.object_name,
  createdAt: asset.created_at,
});

const ASSET_SELECT = {
  id: true,
  photo_type: true,
  employee_id: true,
  object_url: true,
  object_id: true,
  object_name: true,
  created_at: true,
};

// Each call is treated as the full, current state of this task's report
// photos (what Step7 currently holds client-side) rather than an incremental
// append — every save soft-deletes whatever was previously recorded and
// writes the submitted list fresh, so re-uploading a required slot replaces
// its old row instead of leaving an orphaned duplicate behind.
export const saveMyAssets = async ({
  taskId,
  userId,
  employeeId,
  branchId,
  assets,
}) => {
  const { default: prisma } = await import("../../../prisma/client.js");

  return prisma.$transaction(async (transaction) => {
    const allocation = await resolveMyAllocation(transaction, {
      taskId,
      userId,
      employeeId,
      branchId,
    });

    if (allocation.site_visit_report && !allocation.site_visit_report.isDraft) {
      throw new AppError("A submitted report cannot be changed", 409);
    }

    await transaction.asset.updateMany({
      where: { task_id: allocation.id, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    if (assets.length > 0) {
      await transaction.asset.createMany({
        data: assets.map((asset) => ({
          task_id: allocation.id,
          case_id: allocation.case_id,
          employee_id: employeeId,
          photo_type: asset.photoType,
          object_url: asset.objectUrl,
          object_id: asset.objectID,
          object_name: asset.objectName,
        })),
      });
    }

    return transaction.asset.findMany({
      where: { task_id: allocation.id, deleted_at: null },
      orderBy: { created_at: "asc" },
      select: ASSET_SELECT,
    });
  });
};

export const findMyAssets = async ({
  taskId,
  userId,
  employeeId,
  branchId,
}) => {
  const { default: prisma } = await import("../../../prisma/client.js");
  const allocation = await resolveMyAllocation(prisma, {
    taskId,
    userId,
    employeeId,
    branchId,
  });

  return prisma.asset.findMany({
    where: { task_id: allocation.id, deleted_at: null },
    orderBy: { created_at: "asc" },
    select: ASSET_SELECT,
  });
};

// Scoped by branch, not by the owning engineer — same access model
// findSubmittedReportByCaseIdForBranch uses for viewing the report itself,
// so anyone authenticated in this branch can view a submitted report's
// photos, not only the engineer who filed it. Asset.case_id is a plain
// snapshot column (not a relation), so the case's own branch/deleted_at is
// checked first, same two-step pattern loadCaseForUpload uses.
export const findAssetsByCaseIdForBranch = async ({ caseId, branchId }) => {
  const { default: prisma } = await import("../../../prisma/client.js");

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, branch_id: true, deleted_at: true },
  });

  if (
    !caseRecord ||
    caseRecord.deleted_at ||
    caseRecord.branch_id !== branchId
  ) {
    throw new AppError("Case not found", 404);
  }

  return prisma.asset.findMany({
    where: { case_id: caseId, deleted_at: null },
    orderBy: { created_at: "asc" },
    select: ASSET_SELECT,
  });
};
