import test from "node:test";
import assert from "node:assert/strict";

import { isReportSubmitted } from "../src/features/engineer/services/engineer.reportLock.js";
import { shapeTask } from "../src/features/engineer/utils/engineer.helpers.js";

test("caseOwnedStep1 takes case info and initiation address from the case", async () => {
  const { caseOwnedStep1 } =
    await import("../src/features/engineer/services/engineer.report.js");

  assert.deepEqual(
    caseOwnedStep1({
      file_number: "BANK-1",
      customer_name: "Rahul",
      customer_contact_number: "98765",
      address: { city: "Noida", pin_code: "201301", id: "addr_1" },
    }),
    {
      caseInfo: {
        file_number: "BANK-1",
        customer_name: "Rahul",
        customer_phone_number: "98765",
      },
      addressAsPerInitiation: {
        city: "Noida",
        district: "",
        state: "",
        pin_code: "201301",
        country: "",
        lane: "",
        landmark: "",
      },
    },
  );
});

test("no report or a draft report does not lock the status", () => {
  assert.equal(isReportSubmitted(null), false);
  assert.equal(isReportSubmitted(undefined), false);
  assert.equal(isReportSubmitted({ isDraft: true }), false);
});

test("a submitted report locks the status", () => {
  assert.equal(isReportSubmitted({ isDraft: false }), true);
});

test("shapeTask exposes report_submitted for the engineer's row", () => {
  const base = { id: "alloc_1", sequence: 1, case: { id: "case_1" } };

  assert.equal(shapeTask(base).report_submitted, false);
  assert.equal(shapeTask(base).report_submitted_at, null);
  assert.equal(
    shapeTask({ ...base, site_visit_report: { isDraft: true } })
      .report_submitted,
    false,
  );

  const submitted = shapeTask({
    ...base,
    site_visit_report: {
      isDraft: false,
      submittedAt: new Date("2026-11-20T10:00:00Z"),
    },
  });
  assert.equal(submitted.report_submitted, true);
  assert.ok(submitted.report_submitted_at);
});
