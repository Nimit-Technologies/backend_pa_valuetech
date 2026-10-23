import assert from "node:assert/strict";
import test from "node:test";
import { saveReportSchema } from "../src/features/engineer/engineer-report.schema.js";
import { mapReportDraft } from "../src/features/engineer/services/engineer.report.js";

const validDraft = () => ({
  action: "draft",
  currentStep: 4,
  completedSteps: [1, 2, 3],
  stepData: {
    step1: {
      caseInfo: { file_number: "FILE-1" },
      addressAsPerInitiation: { city: "Noida" },
      addressAsPerSite: { city: "Noida" },
      sameAsInitiation: true,
    },
    step2: {
      personInfo: { name: "Site contact" },
      locality: { residential: true, other: true, otherText: "Suburban" },
      colony: { authorized: true },
      ownership: { Freehold: true },
      neighborhood: { "upper middle class": true },
      property: { "Builder flat": true },
      construction: { "RCC Framed Structure": true },
      occupation: { rented: true },
      rentedDetails: { "number of tenant": "2", "rent payable": "25000.50" },
    },
    step3: {
      propertyUsage: { residential: true },
      propertyLocation: { "corner plot": true },
      coverage: {
        east: "Road",
        "plot measured yes or no, (if no give reason)": "No, locked",
        "year of construction": "2008",
        "entire property shown": "Yes",
        "internal pics taken": "No",
        "number of floors": "3",
      },
      transport: { hospital: true },
      road: { developed: true },
    },
    step4: {
      "Ground floor": {
        accommodation: "2 rooms",
        carpetCovered: "800 sq ft",
        occupancy: "Rented",
        purpose: "Residential",
      },
    },
    step5: {
      "internal finish": "Marble",
      "development in locality in %": "75.5",
    },
    step6: {
      "negative remarks which affect the value of property": "None",
    },
  },
});

test("report draft schema accepts the wizard payload and excludes photo files", () => {
  const result = saveReportSchema.safeParse(validDraft());
  assert.equal(result.success, true);
  assert.equal(
    saveReportSchema.safeParse({
      ...validDraft(),
      stepData: { ...validDraft().stepData, step7: { photos: [] } },
    }).success,
    false,
  );
});

test("maps UI labels and string inputs to the typed report schema", () => {
  const parsed = saveReportSchema.parse(validDraft());
  const { report, floorAreas } = mapReportDraft(parsed.stepData);

  assert.deepEqual(report.localityTypes, ["RESIDENTIAL", "OTHER"]);
  assert.equal(report.localityOther, "Suburban");
  assert.deepEqual(report.neighborhoodClass, ["UPPER_MIDDLE_CLASS"]);
  assert.deepEqual(report.propertyTypes, ["BUILDER_FLAT"]);
  assert.deepEqual(report.propertyUsages, ["RESIDENTIAL"]);
  assert.deepEqual(report.facilities, ["HOSPITAL"]);
  assert.equal(report.numberOfTenants, 2);
  assert.equal(report.rentPayable, "25000.50");
  assert.equal(report.plotMeasured, false);
  assert.equal(report.plotNotMeasuredReason, "locked");
  assert.equal(report.yearOfConstruction, 2008);
  assert.equal(report.internalPicsTaken, false);
  assert.equal(report.developmentInLocalityPct, "75.5");
  assert.equal(floorAreas[0].floor, "GROUND");
  assert.equal(floorAreas[0].carpetCovered, "800 sq ft");
});

test("rejects duplicate completion steps and invalid numeric form values", () => {
  const duplicateSteps = validDraft();
  duplicateSteps.completedSteps = [1, 1];
  assert.equal(saveReportSchema.safeParse(duplicateSteps).success, false);

  const invalidPercentage = validDraft();
  invalidPercentage.stepData.step5["development in locality in %"] = "1000";
  const parsed = saveReportSchema.parse(invalidPercentage);
  assert.throws(
    () => mapReportDraft(parsed.stepData),
    /development in locality in % must be a valid number/,
  );
});

test("requires contact and site-person fields before final submission", () => {
  const submission = validDraft();
  submission.action = "submit";
  submission.completedSteps = [1, 2, 3, 4, 5, 6, 7];
  submission.stepData.step1.caseInfo = {};
  submission.stepData.step2.personInfo = {};

  const result = saveReportSchema.safeParse(submission);
  assert.equal(result.success, false);
  assert.equal(
    result.error.issues.filter(
      ({ message }) =>
        message === "This field is required to submit the report",
    ).length,
    6,
  );
});
