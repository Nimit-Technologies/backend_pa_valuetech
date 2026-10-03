import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";
import { createdBySnapshotFields } from "../utils/case-history.js";
import { recordCaseTransition } from "../utils/case-count.js";

// `actor` is the identity snapshot of the authenticated user (see
// createCaseIdentitySnapshot). No CaseUpdateHistory row is written here: that
// table records *updates*, and the creation itself is already captured by the
// created_by_* columns and created_at.
export const createCase = async (data, actor) => {
  const {
    file_number,
    banker_name,
    customer_name,
    customer_contact_number,
    case_type,
    is_active,
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
      is_active,
      business_type: { connect: { id: business_type_id } },
      bank: { connect: { id: bank_id } },
      branch: { connect: { id: branch_id } },
      employee: { connect: { employee_id } },
      address: { create: address },
      ...createdBySnapshotFields(actor),
    },
    include: caseInclude,
  });

  recordCaseTransition(null, caseRecord);
  return shapeCase(caseRecord);
};
