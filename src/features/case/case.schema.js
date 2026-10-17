import { z } from "zod";
import {
  addressSchema,
  partialAddressSchema,
} from "../address/address.schema.js";
import { isValidCuid } from "../../utils/is-valid-cuid.js";
import { MAX_OFFSET, normalizePhone } from "./utils/case-similarity.js";

// The bank's own reference for the file. Upper-cased rather than lower-cased,
// matching how bank_branch_code and gst_number are stored: these are machine
// codes, not names. Normalizing is what lets the composite @@unique on
// (branch_id, business_type_id, file_number) behave the way the duplicate check
// reads it, since a Prisma unique is case-sensitive.
const fileNumber = z
  .string()
  .min(1, "File number is required")
  .max(50, "File number must be less than 50 characters")
  .transform((value) => value.trim().toUpperCase());

const bankerName = z
  .string()
  .min(1, "Banker name is required")
  .max(50, "Banker name must be less than 50 characters")
  .transform((value) => value.trim().toLowerCase());

const customerName = z
  .string()
  .min(1, "Customer name is required")
  .max(50, "Customer name must be less than 50 characters")
  .transform((value) => value.trim().toLowerCase());

const customerContactNumber = z
  .string()
  .length(10, "Phone number must be 10 digits")
  .regex(/^\d+$/, "Phone number must contain only digits")
  .transform((value) => value.trim());

const caseType = z
  .string()
  .min(1, "Case type is required")
  .max(50, "Case type must be less than 50 characters")
  .transform((value) => value.trim().toLowerCase());

// The assigned engineer, identified by their own employee code rather than a
// cuid — distinct from created_by_id, which is always the authenticated actor.
// Lower-cased to match how User stores it.
const employeeId = z
  .string()
  .min(1, "Employee ID is required")
  .max(50, "Employee ID must be less than 50 characters")
  .transform((value) => value.trim().toLowerCase());

export const caseSchema = z
  .object({
    file_number: fileNumber,
    banker_name: bankerName,
    customer_name: customerName,
    customer_contact_number: customerContactNumber,
    case_type: caseType,

    business_type_id: z.string().min(1, "Business type ID is required"),
    bank_id: z.string().min(1, "Bank ID is required"),

    employee_id: employeeId.optional(),

    branch_id: z.string().min(1, "Branch ID cannot be empty").optional(),

    address: addressSchema,

    // The similar-case gate, below. A create is refused once when an existing
    // case looks like the same customer or property; the client shows the
    // matches and resubmits with this set to go ahead. Being `.strict()`, the
    // flag has to be sent deliberately rather than slipping through.
    confirm_duplicate: z.boolean().default(false),
  })
  .strict();

export const updateCaseSchema = z
  .object({
    file_number: fileNumber.optional(),
    banker_name: bankerName.optional(),
    customer_name: customerName.optional(),
    customer_contact_number: customerContactNumber.optional(),
    case_type: caseType.optional(),

    bank_id: z.string().min(1, "Bank ID cannot be empty").optional(),
    branch_id: z.string().min(1, "Branch ID cannot be empty").optional(),

    business_type_id: z
      .string()
      .min(1, "Business type ID cannot be empty")
      .optional(),

    address: partialAddressSchema.optional(),
  })

  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const assignCaseSchema = z
  .object({
    employee_id: employeeId,
  })
  .strict();

export const CANCELLATION_REASONS = [
  "withdrawn_by_bank",
  "customer_declined",
  "duplicate",
  "data_error",
  "property_inaccessible",
];

export const transitionCaseSchema = z
  .object({
    // The target status, by code. Codes are immutable, so a client's stored
    // reference cannot be broken by a super admin renaming the label.
    status: z
      .string()
      .min(1, "Target status is required")
      .transform((value) => value.trim().toLowerCase()),

    // Required on backward moves and on anything touching a terminal state —
    // revisit, rework, cancel, reopen. The transition rules decide which;
    // see constant/case-transitions.js.
    reason: z
      .string()
      .min(1, "Reason cannot be empty")
      .max(500, "Reason must be less than 500 characters")
      .transform((value) => value.trim())
      .optional(),

    cancellation_reason: z.enum(CANCELLATION_REASONS).optional(),
  })
  .strict();

// The similar-case search, run while a create form is being filled.
//
// Deliberately more forgiving about the phone number than `customerContactNumber`
// above: a number pasted as "+91 75369-87402" means the same customer as one
// typed as "7536987402", and a search that disagrees is a silent miss rather
// than a visible error. normalizePhone reduces either to the ten digits the
// column actually stores. A create still goes through the stricter rule.
const searchContactNumber = z
  .string()
  .min(1, "Phone number is required")
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);

    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Phone number must contain at least 10 digits",
      });
      return z.NEVER;
    }

    return normalized;
  });

export const similarCaseSchema = z
  .object({
    customer_contact_number: searchContactNumber,

    // Reused wholesale: it already lower-cases and trims every component and
    // enforces the 6-digit PIN, which is most of what the search needs before
    // the SQL side normalizes punctuation and whitespace.
    address: addressSchema,

    // The case being edited, excluded from its own results. Absent on a create,
    // where there is no case yet.
    case_id: z
      .string()
      .refine(isValidCuid, "Case ID is not a valid ID")
      .optional(),

    // "Load more": the client asks for the next page by how far in it already
    // is. A cursor on `id` — what the case list paginates with — cannot work
    // here, because the ordering is by match quality, not by id.
    //
    // There is no `limit`: page size comes from DATA_LIMIT. Being `.strict()`,
    // sending one is a 400 rather than silently ignored.
    offset: z
      .number()
      .int("Offset must be a whole number")
      .min(0, "Offset cannot be negative")
      .max(MAX_OFFSET, `Offset cannot exceed ${MAX_OFFSET}`)
      .default(0),
  })
  .strict();
