import { z } from "zod";

const text = z.string().max(5000);
const textMap = z.record(z.string(), text).default({});
const checkboxMap = z
  .record(z.string(), z.union([z.boolean(), text]))
  .default({});
const address = z.record(z.string(), text).default({});

const stepDataSchema = z
  .object({
    step1: z
      .object({
        caseInfo: z
          .object({
            file_number: text.optional(),
            customer_name: text.optional(),
            customer_phone_number: text.optional(),
          })
          .default({}),
        addressAsPerInitiation: address,
        addressAsPerSite: address,
        sameAsInitiation: z.boolean().default(false),
      })
      .strict(),
    step2: z
      .object({
        personInfo: z
          .object({
            name: text.optional(),
            contactNumber: text.optional(),
            relation: text.optional(),
          })
          .default({}),
        locality: checkboxMap,
        colony: checkboxMap,
        ownership: checkboxMap,
        neighborhood: checkboxMap,
        property: checkboxMap,
        construction: checkboxMap,
        occupation: checkboxMap,
        rentedDetails: textMap,
      })
      .strict(),
    step3: z
      .object({
        propertyUsage: checkboxMap,
        propertyLocation: checkboxMap,
        coverage: textMap,
        transport: checkboxMap,
        road: checkboxMap,
      })
      .strict(),
    step4: z.record(
      z.string(),
      z
        .object({
          accommodation: text,
          carpetCovered: text,
          occupancy: text,
          purpose: text,
        })
        .strict(),
    ),
    step5: textMap,
    step6: textMap,
  })
  .strict();

export const saveReportSchema = z
  .object({
    action: z.enum(["draft", "submit"]),
    currentStep: z.number().int().min(1).max(7),
    completedSteps: z.array(z.number().int().min(1).max(7)).max(7),
    stepData: stepDataSchema,
  })
  .strict()
  .superRefine(({ action, completedSteps, stepData }, context) => {
    if (new Set(completedSteps).size !== completedSteps.length) {
      context.addIssue({
        code: "custom",
        path: ["completedSteps"],
        message: "Completed steps must not contain duplicates",
      });
    }

    if (action === "submit") {
      if (
        !Array.from({ length: 7 }, (_, index) => index + 1).every((step) =>
          completedSteps.includes(step),
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["completedSteps"],
          message: "Complete all report steps before submitting",
        });
      }

      const requiredFields = [
        ["step1", "caseInfo", "file_number"],
        ["step1", "caseInfo", "customer_name"],
        ["step1", "caseInfo", "customer_phone_number"],
        ["step2", "personInfo", "name"],
        ["step2", "personInfo", "contactNumber"],
        ["step2", "personInfo", "relation"],
      ];

      for (const path of requiredFields) {
        let value = stepData;
        for (const key of path) value = value?.[key];

        if (typeof value !== "string" || !value.trim()) {
          context.addIssue({
            code: "custom",
            path: ["stepData", ...path],
            message: "This field is required to submit the report",
          });
        }
      }

      const otherGroups = [
        ["step2", "locality"],
        ["step2", "colony"],
        ["step2", "ownership"],
        ["step2", "neighborhood"],
        ["step2", "property"],
        ["step2", "construction"],
        ["step2", "occupation"],
        ["step3", "propertyUsage"],
        ["step3", "propertyLocation"],
        ["step3", "transport"],
        ["step3", "road"],
      ];

      for (const path of otherGroups) {
        let group = stepData;
        for (const key of path) group = group?.[key];

        if (group?.other && !group.otherText?.trim()) {
          context.addIssue({
            code: "custom",
            path: ["stepData", ...path, "otherText"],
            message: "Describe the selected Other option",
          });
        }
      }
    }
  });
