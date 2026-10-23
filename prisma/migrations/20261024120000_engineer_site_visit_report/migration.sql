-- CreateEnum
CREATE TYPE "LocalityType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ColonyType" AS ENUM ('AUTHORIZED', 'UNAUTHORIZED', 'MCD', 'NDMC', 'GDA', 'MCPL_PROPERTY', 'REGULARIZED', 'GRAM_PANCHAYAT', 'OTHER');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('FREEHOLD', 'LEASEHOLD', 'OTHER');

-- CreateEnum
CREATE TYPE "NeighborhoodClass" AS ENUM ('POSH', 'GOOD', 'MIDDLE', 'POOR', 'UPPER_MIDDLE_CLASS', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('BUNGLOW', 'SOCIETY', 'BUILDER_FLAT', 'AUTHORITY', 'INDUSTRIAL', 'SHOP', 'OFFICE', 'BUILDER_FLOOR', 'DEVELOPER_APT', 'INDEP_HOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "ConstructionType" AS ENUM ('RCC_FRAMED_STRUCTURE', 'LOAD_BEARING_WALLS', 'MIXED', 'T_IRON', 'TIN_SHED', 'TRUSS', 'OTHER');

-- CreateEnum
CREATE TYPE "OccupationStatus" AS ENUM ('APPLICANT_OCCUPIED', 'RENTED', 'SELLER', 'VACANT', 'UNDER_CONSTRUCTION', 'COMPANY_OCCUPIED', 'UNDER_RENOVATION', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyUsage" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'SHOP', 'OFFICE', 'VACANT', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyLocation" AS ENUM ('INTERMITTENT', 'CORNER_PLOT', 'MAIN_ROAD', 'INNER_LANE', 'PARKING_FACING', 'OTHER');

-- CreateEnum
CREATE TYPE "Facility" AS ENUM ('RAILWAY', 'BUS_STAND', 'HOSPITAL', 'SCHOOL', 'OTHER');

-- CreateEnum
CREATE TYPE "RoadCondition" AS ENUM ('DEVELOPED', 'UNDEVELOPED', 'OTHER');

-- CreateEnum
CREATE TYPE "FloorLevel" AS ENUM ('BASEMENT', 'STILT', 'GROUND', 'FIRST', 'SECOND', 'THIRD', 'FOURTH_AND_ABOVE', 'MEZZANINE');

-- CreateTable
CREATE TABLE "SiteVisitReport" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3),
    "formData" JSONB NOT NULL,
    "caseInfo" JSONB,
    "addressAsPerInitiation" JSONB,
    "addressAsPerSite" JSONB,
    "sameAsInitiation" BOOLEAN NOT NULL DEFAULT false,
    "personName" TEXT,
    "personContact" TEXT,
    "relationWithClient" TEXT,
    "localityTypes" "LocalityType"[],
    "localityOther" TEXT,
    "colonyTypes" "ColonyType"[],
    "colonyOther" TEXT,
    "ownershipTypes" "OwnershipType"[],
    "ownershipOther" TEXT,
    "neighborhoodClass" "NeighborhoodClass"[],
    "neighborhoodOther" TEXT,
    "propertyTypes" "PropertyType"[],
    "propertyTypeOther" TEXT,
    "constructionTypes" "ConstructionType"[],
    "constructionOther" TEXT,
    "occupationStatuses" "OccupationStatus"[],
    "occupationOther" TEXT,
    "numberOfTenants" INTEGER,
    "tenantName" TEXT,
    "occupiedSince" TEXT,
    "purposeOfUse" TEXT,
    "rentArea" TEXT,
    "rentPayable" DECIMAL(14,2),
    "propertyUsages" "PropertyUsage"[],
    "propertyUsageOther" TEXT,
    "propertyLocations" "PropertyLocation"[],
    "propertyLocationOther" TEXT,
    "boundaryEast" TEXT,
    "boundaryWest" TEXT,
    "boundaryNorth" TEXT,
    "boundarySouth" TEXT,
    "electricityDocumentSeen" TEXT,
    "electricityMeterInfo" TEXT,
    "plotAreaWithDimension" TEXT,
    "plotMeasured" BOOLEAN,
    "plotNotMeasuredReason" TEXT,
    "floorOfFlat" TEXT,
    "yearOfConstruction" INTEGER,
    "entirePropertyShown" BOOLEAN,
    "internalPicsTaken" BOOLEAN,
    "numberOfFloors" INTEGER,
    "unitsOnEachFloor" TEXT,
    "liftStairsBoth" TEXT,
    "facilities" "Facility"[],
    "facilitiesOther" TEXT,
    "roadCondition" "RoadCondition"[],
    "roadConditionOther" TEXT,
    "internalFinish" TEXT,
    "externalFinish" TEXT,
    "measuredRoadWidth" TEXT,
    "developmentInLocalityPct" DECIMAL(5,2),
    "occupancyInLocalityPct" DECIMAL(5,2),
    "communityAreaPct" DECIMAL(5,2),
    "communityName" TEXT,
    "propertyIdentifiable" TEXT,
    "propertyDemarcated" TEXT,
    "landmark" TEXT,
    "distanceFromLandmark" TEXT,
    "marketLandRateInLocality" TEXT,
    "rentalRangePM" TEXT,
    "marketRateOfFlat" TEXT,
    "marketRateOfFloor" TEXT,
    "marketRateOfShop" TEXT,
    "propertyDealerNumber1" TEXT,
    "propertyDealerNumber2" TEXT,
    "mainRoadDistance" TEXT,
    "negativeRemarks" TEXT,
    "positiveRemarks" TEXT,
    "visitedFromOutsideReason" TEXT,
    "reportHighlights" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteVisitReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorWiseArea" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "floor" "FloorLevel" NOT NULL,
    "accommodation" TEXT,
    "carpetCovered" TEXT,
    "occupancy" TEXT,
    "purpose" TEXT,

    CONSTRAINT "FloorWiseArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteVisitReport_allocationId_key" ON "SiteVisitReport"("allocationId");

-- CreateIndex
CREATE UNIQUE INDEX "FloorWiseArea_reportId_floor_key" ON "FloorWiseArea"("reportId", "floor");

-- AddForeignKey
ALTER TABLE "SiteVisitReport" ADD CONSTRAINT "SiteVisitReport_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisitReport" ADD CONSTRAINT "SiteVisitReport_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisitReport" ADD CONSTRAINT "SiteVisitReport_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorWiseArea" ADD CONSTRAINT "FloorWiseArea_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "SiteVisitReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
