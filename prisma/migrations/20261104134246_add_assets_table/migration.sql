-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('RoadApproachPhoto', 'OutsidePhoto', 'NamePlatePhoto', 'MeterPhoto', 'SelfiePhoto', 'AdditionalPhoto');

-- AlterTable
ALTER TABLE "allocations" ADD COLUMN     "engineer_sheet_id" TEXT;

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "photo_type" "PhotoType" NOT NULL,
    "object_url" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "object_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_task_id_idx" ON "assets"("task_id");

-- CreateIndex
CREATE INDEX "assets_case_id_idx" ON "assets"("case_id");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
