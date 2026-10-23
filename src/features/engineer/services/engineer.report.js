import { AppError } from "../../../utils/app-error.js";
import { shapeTask, taskSelect } from "../utils/engineer.helpers.js";
import { DATA_LIMIT } from "../../../constant/pagination.js";

const ENUMS = {
  locality: new Set([
    "RESIDENTIAL",
    "COMMERCIAL",
    "INDUSTRIAL",
    "AGRICULTURAL",
    "OTHER",
  ]),
  colony: new Set([
    "AUTHORIZED",
    "UNAUTHORIZED",
    "MCD",
    "NDMC",
    "GDA",
    "MCPL_PROPERTY",
    "REGULARIZED",
    "GRAM_PANCHAYAT",
    "OTHER",
  ]),
  ownership: new Set(["FREEHOLD", "LEASEHOLD", "OTHER"]),
  neighborhood: new Set([
    "POSH",
    "GOOD",
    "MIDDLE",
    "POOR",
    "UPPER_MIDDLE_CLASS",
    "OTHER",
  ]),
  property: new Set([
    "BUNGLOW",
    "SOCIETY",
    "BUILDER_FLAT",
    "AUTHORITY",
    "INDUSTRIAL",
    "SHOP",
    "OFFICE",
    "BUILDER_FLOOR",
    "DEVELOPER_APT",
    "INDEP_HOUSE",
    "OTHER",
  ]),
  construction: new Set([
    "RCC_FRAMED_STRUCTURE",
    "LOAD_BEARING_WALLS",
    "MIXED",
    "T_IRON",
    "TIN_SHED",
    "TRUSS",
    "OTHER",
  ]),
  occupation: new Set([
    "APPLICANT_OCCUPIED",
    "RENTED",
    "SELLER",
    "VACANT",
    "UNDER_CONSTRUCTION",
    "COMPANY_OCCUPIED",
    "UNDER_RENOVATION",
    "OTHER",
  ]),
  propertyUsage: new Set([
    "RESIDENTIAL",
    "COMMERCIAL",
    "INDUSTRIAL",
    "SHOP",
    "OFFICE",
    "VACANT",
    "OTHER",
  ]),
  propertyLocation: new Set([
    "INTERMITTENT",
    "CORNER_PLOT",
    "MAIN_ROAD",
    "INNER_LANE",
    "PARKING_FACING",
    "OTHER",
  ]),
  facilities: new Set(["RAILWAY", "BUS_STAND", "HOSPITAL", "SCHOOL", "OTHER"]),
  road: new Set(["DEVELOPED", "UNDEVELOPED", "OTHER"]),
};

const FLOOR_LEVELS = new Map([
  ["Basement", "BASEMENT"],
  ["Stilt", "STILT"],
  ["Ground floor", "GROUND"],
  ["First floor", "FIRST"],
  ["Second floor", "SECOND"],
  ["Third floor", "THIRD"],
  ["Fourth floor & above", "FOURTH_AND_ABOVE"],
  ["Mezzanine", "MEZZANINE"],
]);

const STEP5_FIELDS = {
  "internal finish": "internalFinish",
  "external finish": "externalFinish",
  "measured road width": "measuredRoadWidth",
  "development in locality in %": "developmentInLocalityPct",
  "occupancy in locality in %": "occupancyInLocalityPct",
  "community area if any %": "communityAreaPct",
  "community name": "communityName",
  "property identifiable & how": "propertyIdentifiable",
  "property demarcated": "propertyDemarcated",
  landmark: "landmark",
  "distance from landmark": "distanceFromLandmark",
  "market land rate in locality": "marketLandRateInLocality",
  "rental range PM": "rentalRangePM",
  "market rate of flat": "marketRateOfFlat",
  "market rate of floor": "marketRateOfFloor",
  "market rate of shop": "marketRateOfShop",
  "property dealer number 1": "propertyDealerNumber1",
  "property dealer number 2": "propertyDealerNumber2",
  "main road distance from property": "mainRoadDistance",
};

const STEP6_FIELDS = {
  "negative remarks which affect the value of property": "negativeRemarks",
  "positive remarks which affect the value of property": "positiveRemarks",
  "if property is visited from outside, please specify reason":
    "visitedFromOutsideReason",
  "description or any other point which to be highlighted in report":
    "reportHighlights",
};

const enumForLabel = (label, allowedValues, fieldName) => {
  const value = label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  if (!allowedValues.has(value)) {
    throw new AppError(`Unsupported ${fieldName} option: ${label}`, 400);
  }

  return value;
};

const selectedEnums = (checkboxValues, allowedValues, fieldName) =>
  Object.entries(checkboxValues)
    .filter(([label, checked]) => label !== "otherText" && checked === true)
    .map(([label]) => enumForLabel(label, allowedValues, fieldName));

const optionalText = (value) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const selectedOtherText = (checkboxValues) =>
  checkboxValues.other ? optionalText(checkboxValues.otherText) : null;

const optionalNumber = (value, label, maxIntegerDigits = 12) => {
  const normalized = value?.trim();
  if (!normalized) return null;

  const pattern = new RegExp(`^\\d{1,${maxIntegerDigits}}(?:\\.\\d{1,2})?$`);
  if (!pattern.test(normalized)) {
    throw new AppError(
      `${label} must be a valid number with up to 2 decimals`,
      400,
    );
  }

  return normalized;
};

const optionalInteger = (value, label) => {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) {
    throw new AppError(`${label} must be a whole number`, 400);
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed > 2_147_483_647) {
    throw new AppError(`${label} is outside the supported range`, 400);
  }
  return parsed;
};

const optionalYesNo = (value, label) => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "yes") return true;
  if (normalized === "no") return false;
  throw new AppError(`${label} must be answered with "yes" or "no"`, 400);
};

const mapCoverage = (coverage) => {
  const measuredText =
    coverage["plot measured yes or no, (if no give reason)"] ?? "";
  if (measuredText.trim() && !/^(yes|no)\b/i.test(measuredText.trim())) {
    throw new AppError(
      'Plot measured must start with "yes" or "no". Add the reason after "no".',
      400,
    );
  }
  const measured = optionalYesNo(
    measuredText.match(/^(yes|no)\b/i)?.[1] ?? "",
    "Plot measured",
  );
  const notMeasuredReason =
    measured === false
      ? optionalText(measuredText.replace(/^no\b\s*[,;:-]?\s*/i, ""))
      : null;

  return {
    boundaryEast: optionalText(coverage.east),
    boundaryWest: optionalText(coverage.west),
    boundaryNorth: optionalText(coverage.north),
    boundarySouth: optionalText(coverage.south),
    electricityDocumentSeen: optionalText(
      coverage["electricity bill/plan/estimate or other document seen at site"],
    ),
    electricityMeterInfo: optionalText(
      coverage[
        "electricity meter seen at site, pls mention meter number, if shown"
      ],
    ),
    plotAreaWithDimension: optionalText(
      coverage["area of plot with dimension"],
    ),
    plotMeasured: measured,
    plotNotMeasuredReason: notMeasuredReason,
    floorOfFlat: optionalText(coverage["floor at which flat is located"]),
    yearOfConstruction: optionalInteger(
      coverage["year of construction"],
      "Year of construction",
    ),
    entirePropertyShown: optionalYesNo(
      coverage["entire property shown"],
      "Entire property shown",
    ),
    internalPicsTaken: optionalYesNo(
      coverage["internal pics taken"],
      "Internal pictures taken",
    ),
    numberOfFloors: optionalInteger(
      coverage["number of floors"],
      "Number of floors",
    ),
    unitsOnEachFloor: optionalText(coverage["unit on each floor"]),
    liftStairsBoth: optionalText(coverage["lift/stairs/both"]),
  };
};

const mapStep5 = (step5) =>
  Object.fromEntries(
    Object.entries(STEP5_FIELDS).map(([label, field]) => [
      field,
      field.endsWith("Pct")
        ? optionalNumber(step5[label], label, 3)
        : optionalText(step5[label]),
    ]),
  );

const mapStep6 = (step6) =>
  Object.fromEntries(
    Object.entries(STEP6_FIELDS).map(([label, field]) => [
      field,
      optionalText(step6[label]),
    ]),
  );

const mapFloorAreas = (step4) =>
  Object.entries(step4).flatMap(([label, values]) => {
    const floor = FLOOR_LEVELS.get(label);
    if (!floor) throw new AppError(`Unsupported floor option: ${label}`, 400);

    const row = {
      floor,
      accommodation: optionalText(values.accommodation),
      carpetCovered: optionalText(values.carpetCovered),
      occupancy: optionalText(values.occupancy),
      purpose: optionalText(values.purpose),
    };

    return [
      row.accommodation,
      row.carpetCovered,
      row.occupancy,
      row.purpose,
    ].some(Boolean)
      ? [row]
      : [];
  });

export const mapReportDraft = (stepData) => {
  const step2 = stepData.step2;
  const step3 = stepData.step3;
  const rented = step2.rentedDetails;

  return {
    report: {
      caseInfo: stepData.step1.caseInfo,
      addressAsPerInitiation: stepData.step1.addressAsPerInitiation,
      addressAsPerSite: stepData.step1.addressAsPerSite,
      sameAsInitiation: stepData.step1.sameAsInitiation,
      personName: optionalText(step2.personInfo.name),
      personContact: optionalText(step2.personInfo.contactNumber),
      relationWithClient: optionalText(step2.personInfo.relation),
      localityTypes: selectedEnums(step2.locality, ENUMS.locality, "locality"),
      localityOther: selectedOtherText(step2.locality),
      colonyTypes: selectedEnums(step2.colony, ENUMS.colony, "colony"),
      colonyOther: selectedOtherText(step2.colony),
      ownershipTypes: selectedEnums(
        step2.ownership,
        ENUMS.ownership,
        "ownership",
      ),
      ownershipOther: selectedOtherText(step2.ownership),
      neighborhoodClass: selectedEnums(
        step2.neighborhood,
        ENUMS.neighborhood,
        "neighborhood",
      ),
      neighborhoodOther: selectedOtherText(step2.neighborhood),
      propertyTypes: selectedEnums(step2.property, ENUMS.property, "property"),
      propertyTypeOther: selectedOtherText(step2.property),
      constructionTypes: selectedEnums(
        step2.construction,
        ENUMS.construction,
        "construction",
      ),
      constructionOther: selectedOtherText(step2.construction),
      occupationStatuses: selectedEnums(
        step2.occupation,
        ENUMS.occupation,
        "occupation",
      ),
      occupationOther: selectedOtherText(step2.occupation),
      numberOfTenants: optionalInteger(
        rented["number of tenant"],
        "Number of tenants",
      ),
      tenantName: optionalText(rented["Tenant name"]),
      occupiedSince: optionalText(rented["Occupied since"]),
      purposeOfUse: optionalText(rented["Purpose of use"]),
      rentArea: optionalText(rented["rent area"]),
      rentPayable: optionalNumber(rented["rent payable"], "Rent payable"),
      propertyUsages: selectedEnums(
        step3.propertyUsage,
        ENUMS.propertyUsage,
        "property usage",
      ),
      propertyUsageOther: selectedOtherText(step3.propertyUsage),
      propertyLocations: selectedEnums(
        step3.propertyLocation,
        ENUMS.propertyLocation,
        "property location",
      ),
      propertyLocationOther: selectedOtherText(step3.propertyLocation),
      ...mapCoverage(step3.coverage),
      facilities: selectedEnums(step3.transport, ENUMS.facilities, "facility"),
      facilitiesOther: selectedOtherText(step3.transport),
      roadCondition: selectedEnums(step3.road, ENUMS.road, "road condition"),
      roadConditionOther: selectedOtherText(step3.road),
      ...mapStep5(stepData.step5),
      ...mapStep6(stepData.step6),
    },
    floorAreas: mapFloorAreas(stepData.step4),
  };
};

export const saveMyReport = async ({
  taskId,
  userId,
  employeeId,
  branchId,
  currentStep,
  completedSteps,
  action,
  stepData,
}) => {
  const { default: prisma } = await import("../../../prisma/client.js");
  const { report, floorAreas } = mapReportDraft(stepData);

  return prisma.$transaction(async (transaction) => {
    const allocation = await transaction.allocation.findFirst({
      where: {
        id: taskId,
        user_id: userId,
        case: {
          deleted_at: null,
          employee_id: employeeId,
          branch_id: branchId,
        },
      },
      select: { id: true, case_id: true, user_id: true },
    });

    if (!allocation) {
      throw new AppError("Task not found", 404);
    }

    const existing = await transaction.siteVisitReport.findUnique({
      where: { allocationId: allocation.id },
      select: { id: true, isDraft: true },
    });
    if (existing && !existing.isDraft) {
      throw new AppError("A submitted report cannot be changed", 409);
    }

    const commonData = {
      currentStep,
      completedSteps,
      isDraft: action === "draft",
      submittedAt: action === "submit" ? new Date() : null,
      formData: JSON.parse(JSON.stringify(stepData)),
      ...report,
    };
    const savedReport = await transaction.siteVisitReport.upsert({
      where: { allocationId: allocation.id },
      create: {
        allocationId: allocation.id,
        caseId: allocation.case_id,
        engineerId: allocation.user_id,
        ...commonData,
        floorAreas: { create: floorAreas },
      },
      update: {
        ...commonData,
        floorAreas: {
          deleteMany: {},
          create: floorAreas,
        },
      },
      include: {
        floorAreas: true,
      },
    });

    return { report: savedReport, created: !existing };
  });
};

export const findMyReport = async ({
  taskId,
  userId,
  employeeId,
  branchId,
}) => {
  const { default: prisma } = await import("../../../prisma/client.js");
  const allocation = await prisma.allocation.findFirst({
    where: {
      id: taskId,
      user_id: userId,
      case: {
        deleted_at: null,
        employee_id: employeeId,
        branch_id: branchId,
      },
    },
    select: { id: true },
  });

  if (!allocation) {
    throw new AppError("Task not found", 404);
  }

  return prisma.siteVisitReport.findUnique({
    where: { allocationId: allocation.id },
    select: {
      id: true,
      isDraft: true,
      currentStep: true,
      completedSteps: true,
      submittedAt: true,
      formData: true,
      updatedAt: true,
    },
  });
};

export const findMySubmittedReportByCaseId = async ({
  caseId,
  userId,
  employeeId,
  branchId,
}) => {
  const { default: prisma } = await import("../../../prisma/client.js");
  const allocation = await prisma.allocation.findFirst({
    where: {
      case_id: caseId,
      user_id: userId,
      site_visit_report: { is: { isDraft: false } },
      case: {
        deleted_at: null,
        employee_id: employeeId,
        branch_id: branchId,
      },
    },
    orderBy: { allocated_at: "desc" },
    select: taskSelect,
  });

  if (!allocation) {
    throw new AppError("Task not found", 404);
  }

  const report = await prisma.siteVisitReport.findFirst({
    where: {
      allocationId: allocation.id,
      isDraft: false,
    },
    select: {
      id: true,
      submittedAt: true,
      formData: true,
    },
  });

  if (!report) {
    throw new AppError("No submitted report found for this case", 404);
  }

  return {
    report,
    task: shapeTask(allocation),
  };
};

export const findSubmittedReportByCaseIdForBranch = async ({
  caseId,
  branchId,
}) => {
  const { default: prisma } = await import("../../../prisma/client.js");
  const report = await prisma.siteVisitReport.findFirst({
    where: {
      caseId,
      isDraft: false,
      case: {
        deleted_at: null,
        branch_id: branchId,
      },
    },
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      caseId: true,
      submittedAt: true,
      formData: true,
      allocation: {
        select: taskSelect,
      },
    },
  });

  if (!report) {
    throw new AppError("Submitted report not found", 404);
  }

  const { allocation, ...submittedReport } = report;
  return {
    report: submittedReport,
    task: shapeTask(allocation),
  };
};

export const listMySubmittedReports = async ({
  page,
  userId,
  employeeId,
  branchId,
}) => {
  const { default: prisma } = await import("../../../prisma/client.js");
  const where = {
    engineerId: userId,
    isDraft: false,
    allocation: {
      is: {
        user_id: userId,
        case: {
          deleted_at: null,
          employee_id: employeeId,
          branch_id: branchId,
        },
      },
    },
  };
  const [reports, totalCount] = await Promise.all([
    prisma.siteVisitReport.findMany({
      where,
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * DATA_LIMIT,
      take: DATA_LIMIT,
      select: {
        id: true,
        caseId: true,
        submittedAt: true,
        case: {
          select: {
            file_number: true,
            customer_name: true,
            case_type: true,
          },
        },
      },
    }),
    prisma.siteVisitReport.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / DATA_LIMIT);
  return {
    reports: reports.map(({ case: caseRecord, ...report }) => ({
      ...report,
      fileNumber: caseRecord.file_number,
      customerName: caseRecord.customer_name,
      caseType: caseRecord.case_type,
    })),
    page,
    pageSize: DATA_LIMIT,
    totalCount,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
};
