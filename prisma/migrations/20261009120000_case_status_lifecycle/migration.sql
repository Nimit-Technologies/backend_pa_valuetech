-- Case status lifecycle.
--
-- Three columns in this migration are NOT NULL on tables that may already hold
-- rows (statuses.code, case_update_histories.action, cases.status_id). Each is
-- added nullable or defaulted, backfilled, then constrained, so the migration
-- applies whether or not those tables are empty.

-- CreateEnum
CREATE TYPE "CancellationReason" AS ENUM ('withdrawn_by_bank', 'customer_declined', 'duplicate', 'data_error', 'property_inaccessible');

-- CreateEnum
CREATE TYPE "CaseAuditAction" AS ENUM ('create', 'update', 'assign', 'reassign', 'status_change', 'soft_delete', 'restore');

-- AlterTable: statuses gain the stable machine key and the terminal marker.
ALTER TABLE "statuses" ADD COLUMN "code" TEXT;
ALTER TABLE "statuses" ADD COLUMN "is_terminal" BOOLEAN NOT NULL DEFAULT false;

-- Backfill any status created before `code` existed by slugifying its name.
UPDATE "statuses"
SET "code" = regexp_replace(lower(btrim("name")), '[^a-z0-9]+', '_', 'g')
WHERE "code" IS NULL;

ALTER TABLE "statuses" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "statuses_code_key" ON "statuses"("code");

-- Any pre-existing close/cancelled row is a terminal state; the seed re-asserts
-- this afterwards for the rows it owns.
UPDATE "statuses" SET "is_terminal" = true WHERE "code" IN ('close', 'cancelled');

-- AlterTable: the audit log records which operation it describes. Existing rows
-- predate the distinction and were all plain updates.
ALTER TABLE "case_update_histories" ADD COLUMN "action" "CaseAuditAction" NOT NULL DEFAULT 'update';
ALTER TABLE "case_update_histories" ALTER COLUMN "action" DROP DEFAULT;
ALTER TABLE "case_update_histories" ADD COLUMN "from_status" TEXT;
ALTER TABLE "case_update_histories" ADD COLUMN "to_status" TEXT;
ALTER TABLE "case_update_histories" ADD COLUMN "reason" TEXT;

-- DropIndex: both are superseded by the composite unique created below, whose
-- (branch_id, business_type_id) prefix also serves the scoped list queries.
DROP INDEX IF EXISTS "cases_branch_id_idx";
DROP INDEX IF EXISTS "cases_file_number_branch_id_idx";

-- AlterTable: is_active is dropped — "active" now means status.is_terminal = false.
ALTER TABLE "cases" DROP COLUMN "is_active";
ALTER TABLE "cases" ADD COLUMN "cancellation_reason" "CancellationReason";
ALTER TABLE "cases" ADD COLUMN "closed_at" TIMESTAMP(3);
ALTER TABLE "cases" ADD COLUMN "updated_by_at" TIMESTAMP(3);
ALTER TABLE "cases" ADD COLUMN "updated_by_department" TEXT;
ALTER TABLE "cases" ADD COLUMN "updated_by_employee_id" TEXT;
ALTER TABLE "cases" ADD COLUMN "updated_by_first_name" TEXT;
ALTER TABLE "cases" ADD COLUMN "updated_by_id" TEXT;
ALTER TABLE "cases" ADD COLUMN "updated_by_role" TEXT;

-- The assigned engineer is now set after creation, which is what makes `open`
-- and `assigned_to_engineer` distinct states.
ALTER TABLE "cases" ALTER COLUMN "employee_id" DROP NOT NULL;

-- file_number is normalized to upper case from here on, matching how bank codes
-- and GST numbers are stored. Existing rows are brought in line before the
-- unique index is created, since a plain composite unique is case-sensitive.
UPDATE "cases" SET "file_number" = upper("file_number");

-- Any case that predates the lifecycle is parked on the first status by
-- sort_order. A no-op on an empty table.
ALTER TABLE "cases" ADD COLUMN "status_id" TEXT;
UPDATE "cases"
SET "status_id" = (
  SELECT "id" FROM "statuses" ORDER BY "sort_order" ASC, "created_at" ASC LIMIT 1
)
WHERE "status_id" IS NULL;
ALTER TABLE "cases" ALTER COLUMN "status_id" SET NOT NULL;

-- AlterTable: coordinators carry the business line they handle; null elsewhere.
ALTER TABLE "users" ADD COLUMN "business_type_id" TEXT;

-- CreateIndex
CREATE INDEX "cases_status_id_idx" ON "cases"("status_id");

-- CreateIndex
CREATE INDEX "cases_updated_by_id_idx" ON "cases"("updated_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "cases_branch_id_business_type_id_file_number_key" ON "cases"("branch_id", "business_type_id", "file_number");

-- CreateIndex
CREATE INDEX "users_business_type_id_idx" ON "users"("business_type_id");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
