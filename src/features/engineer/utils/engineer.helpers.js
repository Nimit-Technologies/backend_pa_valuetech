import { formatDateTime } from "../../case/utils/case-history.js";
import {
  statusSelect,
  bankSelect,
  addressListSelect,
} from "../../case/services/case.service.helpers.js";

// The engineer's task list is rooted on Allocation, not Case: one task IS one
// allocation. Rooting it on Case would bury the two fields this screen is built
// around — the assign date and the completion date — inside an array the client
// would have to search for its own row.
//
// The selects for status, bank and address are borrowed from the case feature so
// a field added there shows up here too, instead of two shapes drifting apart.
// addressListSelect in particular excludes `search_text`, a long derived string
// the trigram search uses and no client has a reason to read.
export const taskSelect = {
  id: true,
  sequence: true,
  allocated_at: true,
  completed_at: true,

  case: {
    select: {
      id: true,
      file_number: true,
      case_type: true,
      customer_name: true,
      customer_contact_number: true,
      status: statusSelect,
      bank: bankSelect,
      address: addressListSelect,
    },
  },

  // Joined live rather than read from the allocated_by_* snapshot columns. The
  // snapshot holds a first name and no phone at all, and an engineer needs a
  // number that still rings today. The snapshot stays what it is — the immutable
  // audit record — and is deliberately not returned here.
  allocated_by: {
    select: {
      id: true,
      employee_id: true,
      first_name: true,
      last_name: true,
      phone: true,
    },
  },
};

// Flattened, because one task is one table row. `task_id` is the allocation id
// and is the stable key for the row; `case_id` is what the view/report links
// need. Both are returned, since they are not the same thing.
export const shapeTask = (allocation) => {
  if (!allocation) return allocation;

  const {
    id,
    sequence,
    allocated_at,
    completed_at,
    case: caseRecord,
    allocated_by,
  } = allocation;

  return {
    task_id: id,
    stage: sequence,

    // Formatted the same way every other timestamp in a case payload is, so one
    // response does not mix two date formats.
    assigned_at: formatDateTime(allocated_at),
    completed_at: formatDateTime(completed_at),

    case_id: caseRecord?.id ?? null,
    file_number: caseRecord?.file_number ?? null,
    case_type: caseRecord?.case_type ?? null,
    customer_name: caseRecord?.customer_name ?? null,
    customer_contact_number: caseRecord?.customer_contact_number ?? null,
    status: caseRecord?.status ?? null,
    bank: caseRecord?.bank ?? null,
    address: caseRecord?.address ?? null,

    // Whoever handed this engineer the task. Named for the act, not the role:
    // isBranchAdminOrCoordinator guards the assign route, so this is not always
    // a coordinator.
    assigned_by: allocated_by
      ? {
          id: allocated_by.id,
          employee_id: allocated_by.employee_id,
          first_name: allocated_by.first_name,
          last_name: allocated_by.last_name,
          phone: allocated_by.phone,
        }
      : null,
  };
};

export const shapeTasks = (rows = []) => rows.map(shapeTask);
