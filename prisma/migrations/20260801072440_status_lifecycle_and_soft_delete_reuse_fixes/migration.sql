-- DropIndex
DROP INDEX "business_types_name_key";

-- DropIndex
DROP INDEX "cases_file_number_branch_id_key";

-- DropIndex
DROP INDEX "statuses_name_key";

-- AlterTable
ALTER TABLE "statuses" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "business_types_name_idx" ON "business_types"("name");

-- CreateIndex
CREATE INDEX "cases_file_number_branch_id_idx" ON "cases"("file_number", "branch_id");

-- CreateIndex
CREATE INDEX "statuses_name_idx" ON "statuses"("name");

-- Partial unique indexes: uniqueness enforced only among non-deleted rows, so a
-- soft-deleted row's natural key (business type name, case file_number+branch_id,
-- status name) can be reused by a new record. Same constraint names as the dropped
-- plain unique indexes, so P2002 error parsing in src/utils/prisma-error.js (which
-- pattern-matches "<table>_<column>_key") still works.
CREATE UNIQUE INDEX "business_types_name_key" ON "business_types"("name") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "cases_file_number_branch_id_key" ON "cases"("file_number", "branch_id") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "statuses_name_key" ON "statuses"("name") WHERE "deleted_at" IS NULL;
