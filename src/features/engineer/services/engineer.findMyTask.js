import prisma from "../../../prisma/client.js";
import { taskSelect, shapeTask } from "../utils/engineer.helpers.js";

export const findMyTask = ({ userId, branchId, caseId }) =>
  prisma.allocation
    .findFirst({
      where: {
        user_id: userId,
        case_id: caseId,
        case: { deleted_at: null, branch_id: branchId },
      },
      select: taskSelect,
    })
    .then(shapeTask);
