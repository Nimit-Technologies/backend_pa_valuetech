import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";
import {
  createCaseHistoryEntry,
  updatedBySnapshotFields,
} from "../utils/case-history.js";

// A data edit: the only operation that writes the updated_by_* snapshot. Status
// transitions, assignment, soft-delete and restore all leave it alone and
// record themselves in update_history instead.
export const updateCase = async (id, data, actor) => {
  const { bank_id, branch_id, business_type_id, address, ...rest } = data;

  const caseRecord = await prisma.case.update({
    where: { id },
    data: {
      ...rest,
      ...(bank_id && { bank: { connect: { id: bank_id } } }),
      ...(branch_id && { branch: { connect: { id: branch_id } } }),
      ...(business_type_id && {
        business_type: { connect: { id: business_type_id } },
      }),
      ...(address && { address: { update: address } }),
      ...updatedBySnapshotFields(actor),
      update_history: {
        create: createCaseHistoryEntry(actor, { action: "update" }),
      },
    },
    include: caseInclude,
  });

  return shapeCase(caseRecord);
};
