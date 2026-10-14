import { findCaseByFileNumber } from "../services/service.findByFileNumber.case.js";
import { createCase as createCaseService } from "../services/service.create.case.js";
import { findSimilarCases } from "../services/service.similar.case.js";
import { getBankById } from "../../banks/services/service.getById.bank.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { getBusinessTypeById } from "../../business_type/services/service.get.business-typeById.js";
import { getUserByEmployeeId } from "../../users/services/service.getByEmployeeId.js";
import { findStatusByCode } from "../../status/services/service.getStatusByCode.js";
import { caseSchema } from "../case.schema.js";
import { getUniqueConstraintField } from "../../../utils/prisma-error.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { resolveCaseScope, CASE_SCOPE } from "../../../utils/case-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { STATUS_CODE } from "../../../constant/case-status.js";
import {
  createCaseIdentitySnapshot,
  formatCaseResponse,
} from "../utils/case-history.js";
import { SCOPED_DUPLICATE_MESSAGES } from "../utils/case-duplicate-messages.js";

export const createCase = async (req, res) => {
  try {
    const parsed = caseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    // created_by_id is required and immutable, so a case cannot be opened
    // without an identifiable actor to attribute it to.
    const actor = createCaseIdentitySnapshot(req.user);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    const {
      file_number,
      bank_id,
      business_type_id,
      employee_id,
      branch_id: bodyBranchId,
      customer_contact_number,
      address,
      confirm_duplicate,
    } = parsed.data;

    const scope = resolveCaseScope(req);

    // A coordinator may only open cases in the business line they handle.
    // Checked before anything else is fetched, since it needs no DB round trip.
    if (
      scope.tier === CASE_SCOPE.BUSINESS_TYPE &&
      business_type_id !== req.user?.business_type_id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only create cases for your own business type",
      });
    }

    const bank = await getBankById(bank_id);
    if (
      respondIfInvalidParent(res, bank, {
        label: "Bank",
        action: "open new cases under it",
      })
    )
      return;

    // A case's branch follows the branch of the bank it is filed under. The
    // client may assert it, but it is re-derived here rather than trusted.
    if (bodyBranchId && bodyBranchId !== bank.branch_id) {
      return res.status(409).json({
        success: false,
        message: "Bank does not belong to the given branch",
      });
    }
    const branch_id = bank.branch_id;

    if (scope.where.branch_id && branch_id !== scope.where.branch_id) {
      return res.status(403).json({
        success: false,
        message: "You can only create cases for your own branch",
      });
    }

    // The business type is looked up scoped to the branch. Business types are
    // unique per branch, so another branch has its own "national" row with a
    // different id — accepting one would produce a case that matches nobody's
    // scope in either branch.
    const [branch, businessType, initialStatus] = await Promise.all([
      getBranchById(branch_id),
      getBusinessTypeById(business_type_id, branch_id),
      findStatusByCode(
        employee_id ? STATUS_CODE.ASSIGNED_TO_ENGINEER : STATUS_CODE.OPEN,
      ),
    ]);

    if (
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "assign new cases to it",
      })
    )
      return;

    if (
      respondIfInvalidParent(res, businessType, {
        label: "Business type",
        action: "assign new cases to it",
      })
    )
      return;

    // Seeded by migration, so a miss means the environment was not set up
    // rather than that the client sent something wrong.
    if (!initialStatus || initialStatus.deleted_at) {
      console.error(
        "createCase error: initial case status is missing — run `npm run seed`",
      );
      return res.status(500).json({
        success: false,
        message:
          "Case statuses are not configured. Contact your administrator.",
      });
    }

    if (employee_id) {
      const assignedUser = await getUserByEmployeeId(employee_id);
      if (
        respondIfInvalidParent(res, assignedUser, {
          label: "Employee",
          action: "assign new cases to them",
        })
      )
        return;

      // getUserByEmployeeId returns the raw row, so the branch comes back as
      // the branch_id scalar rather than a nested relation.
      if (assignedUser.branch_id !== branch_id) {
        return res.status(409).json({
          success: false,
          message: "Assigned employee does not belong to this branch",
        });
      }
    }

    const existing = await findCaseByFileNumber(
      file_number,
      branch_id,
      business_type_id,
    );
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.deleted_at
          ? "A soft-deleted case already holds this file number; restore it instead"
          : SCOPED_DUPLICATE_MESSAGES.file_number,
      });
    }

    // The last gate before the insert, and the only advisory one: every check
    // above is a hard refusal, this one is a question. An existing case with
    // the same customer phone number, or an address that reads like the same
    // property, is usually the same job being opened twice — so the first
    // attempt comes back with those cases instead of a new row, and the client
    // resubmits with confirm_duplicate once the user has looked at them.
    //
    // Branch-wide rather than narrowed to the caller's own business type: the
    // duplicate most worth catching is the same property already filed under a
    // different business line. branch_id is the one derived from the bank
    // above, which is the branch this case would actually belong to.
    //
    // Paging the matches is the standalone POST /case/similar endpoint's job.
    // This returns the first page and says whether more exist; "load more"
    // goes there with an offset rather than re-attempting the create.
    if (!confirm_duplicate) {
      const { similar_cases, caseLength, dataLimit, hasNextPage, nextOffset } =
        await findSimilarCases({
          customerContactNumber: customer_contact_number,
          address,
          branchId: branch_id,
        });

      if (similar_cases.length) {
        logAuthEvent("case_create_blocked_as_duplicate", {
          file_number,
          branch_id,
          bank_id,
          business_type_id,
          matched_case_ids: similar_cases.map((match) => match.id),
          actor_id: req.user?.id ?? null,
          ip: req.ip,
          success: false,
        });

        return res.status(409).json({
          success: false,
          message:
            "Similar cases already exist. Review them, then resubmit with confirm_duplicate to create this case anyway.",
          similar_cases,
          caseLength,
          dataLimit,
          hasNextPage,
          nextOffset,
        });
      }
    }

    const caseRecord = await createCaseService(
      { ...parsed.data, branch_id },
      actor,
      { statusId: initialStatus.id, statusCode: initialStatus.code },
    );

    logAuthEvent("case_created", {
      case_id: caseRecord.id,
      file_number,
      branch_id,
      bank_id,
      business_type_id,
      employee_id: employee_id ?? null,
      status: initialStatus.code,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res
      .status(201)
      .json({ success: true, data: formatCaseResponse(caseRecord) });
  } catch (error) {
    // A concurrent create slipped past the findCaseByFileNumber check above.
    // The composite @@unique is what actually closes the window; this maps the
    // DB's refusal onto the same message the pre-check would have given.
    if (error?.code === "P2002") {
      const field = getUniqueConstraintField(error);
      const scopedMessage = SCOPED_DUPLICATE_MESSAGES[field];
      if (scopedMessage) {
        console.error(`createCase error: ${scopedMessage}`);
        return res.status(409).json({ success: false, message: scopedMessage });
      }
      return res
        .status(409)
        .json({ success: false, message: "Case already exists" });
    }
    console.error("createCase error:", error);
    res.status(500).json({ success: false, message: "Failed to create case" });
  }
};
