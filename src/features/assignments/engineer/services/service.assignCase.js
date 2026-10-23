import prisma from "../../../../prisma/client.js";
import {
  caseInclude,
  shapeCase,
} from "../../../case/services/case.service.helpers.js";
import {
  createCaseHistoryEntry,
  updatedBySnapshotFields,
} from "../../../case/utils/case-history.js";

export const assignCase = async (
  id,
  {
    employee_id,
    employeeUserId,
    roleId,
    statusId,
    businessTypeId,
    branchId,
    previousEmployeeId,
    expectedStatusId,
    statusCode,
    previousStatusCode,
    isReassignment,
  },
  actor,
) => {
  const caseRecord = await prisma.$transaction(
    async (tx) => {
      let updatedCase;
      try {
        updatedCase = await tx.case.update({
          where: {
            id,
            employee_id: previousEmployeeId,
            status_id: expectedStatusId,
            branch_id: branchId,
            deleted_at: null,
          },
          data: {
            employee: { connect: { employee_id } },
            status: { connect: { id: statusId } },
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
      } catch (error) {
        if (error.code === "P2025") return null;
        throw error;
      }

      const { _max } = await tx.allocation.aggregate({
        where: { case_id: id },
        _max: { sequence: true },
      });

      await tx.allocation.create({
        data: {
          case_id: id,
          user_id: employeeUserId,
          role_id: roleId,
          status_id: statusId,
          business_type_id: businessTypeId,
          allocated_by_id: actor.id,
          allocated_by_first_name: actor.first_name,
          allocated_by_employee_id: actor.employee_id,
          allocated_by_role: actor.role,
          allocated_by_department: actor.department,
          sequence: (_max.sequence ?? 0) + 1,
        },
      });

      return updatedCase;
    },
    { isolationLevel: "Serializable" },
  );

  return caseRecord ? shapeCase(caseRecord) : null;
};
