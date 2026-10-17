import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";
import {
  createdBySnapshotFields,
  createCaseHistoryEntry,
} from "../utils/case-history.js";

// `actor` is the identity snapshot of the authenticated user. `statusId` is
// resolved by the controller — `open`, or `assigned_to_engineer` when an
// engineer is named up front.
//
// updated_by_* is deliberately left null: creation is not an edit, and a client
// rendering "last modified by" falls back to created_by.
export const createCase = async (data, actor, { statusId, statusCode }) => {
  const {
    file_number,
    banker_name,
    customer_name,
    customer_contact_number,
    case_type,
    business_type_id,
    bank_id,
    branch_id,
    employee_id,
    address,
  } = data;

  const caseRecord = await prisma.case.create({
    data: {
      file_number,
      banker_name,
      customer_name,
      customer_contact_number,
      case_type,
      business_type: { connect: { id: business_type_id } },
      bank: { connect: { id: bank_id } },
      branch: { connect: { id: branch_id } },
      status: { connect: { id: statusId } },
      ...(employee_id && { employee: { connect: { employee_id } } }),
      address: { create: address },
      ...createdBySnapshotFields(actor),
      // Unlike the old behavior, creation does leave a history row: the audit
      // trail is meant to cover every operation, and `created_by_*` alone
      // cannot be read back as part of one ordered timeline.
      update_history: {
        create: createCaseHistoryEntry(actor, {
          action: "create",
          to: statusCode,
        }),
      },
    },
    include: caseInclude,
  });

  return shapeCase(caseRecord);
};
