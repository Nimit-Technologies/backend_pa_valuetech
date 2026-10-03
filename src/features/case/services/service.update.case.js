import prisma from "../../../prisma/client.js";
import { caseInclude, shapeCase } from "./case.service.helpers.js";
import { createCaseHistoryEntry } from "../utils/case-history.js";
import { recordCaseTransition } from "../utils/case-count.js";

// `actor` is the identity snapshot of the authenticated user; it becomes one
// CaseUpdateHistory row appended to this case's audit trail. `existing` is the
// row as it was before this write, supplying the "before" side of the count
// transition.
export const updateCase = async (id, data, actor, existing) => {
  const {
    business_type_id,
    bank_id,
    branch_id,
    employee_id,
    address,
    ...rest
  } = data;

  const historyEntry = createCaseHistoryEntry(actor);

  const caseRecord = await prisma.case.update({
    where: { id },
    data: {
      ...rest,
      ...(business_type_id && {
        business_type: { connect: { id: business_type_id } },
      }),
      ...(bank_id && { bank: { connect: { id: bank_id } } }),
      ...(branch_id && { branch: { connect: { id: branch_id } } }),
      ...(employee_id && { employee: { connect: { employee_id } } }),
      ...(address && { address: { update: address } }),
      ...(historyEntry && { update_history: { create: historyEntry } }),
    },
    include: caseInclude,
  });

  // `data` may flip is_active; the transition works that out from the rows.
  recordCaseTransition(existing, caseRecord);
  return shapeCase(caseRecord);
};
