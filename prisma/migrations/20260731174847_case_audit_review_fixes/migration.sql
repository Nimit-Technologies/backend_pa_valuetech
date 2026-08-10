-- DropIndex
DROP INDEX "banks_branch_code_key";

-- DropIndex
DROP INDEX "banks_gst_number_key";

-- DropIndex
DROP INDEX "banks_name_key";

-- DropIndex
DROP INDEX "branches_name_key";

-- DropIndex
DROP INDEX "departments_name_branch_id_key";

-- DropIndex
DROP INDEX "roles_name_department_id_key";

-- DropIndex
DROP INDEX "users_aadhaar_number_key";

-- DropIndex
DROP INDEX "users_email_key";

-- DropIndex
DROP INDEX "users_employee_id_key";

-- DropIndex
DROP INDEX "users_phone_key";

-- Partial unique indexes: uniqueness enforced only among non-deleted rows, so a
-- soft-deleted row's natural key (employee_id, email, phone, aadhaar_number, name,
-- gst_number, branch_code, name+parent_id) can be reused by a new/rehired record.
-- Same constraint names as the dropped plain unique indexes, so P2002 error parsing
-- in src/utils/prisma-error.js (which pattern-matches "<table>_<column>_key") still works.
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "users_email_key" ON "users"("email") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "users_aadhaar_number_key" ON "users"("aadhaar_number") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "branches_name_key" ON "branches"("name") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "banks_name_key" ON "banks"("name") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "banks_gst_number_key" ON "banks"("gst_number") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "banks_branch_code_key" ON "banks"("branch_code") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "departments_name_branch_id_key" ON "departments"("name", "branch_id") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "roles_name_department_id_key" ON "roles"("name", "department_id") WHERE "deleted_at" IS NULL;

-- AlterTable
ALTER TABLE "case_update_histories" ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "employee_id" TEXT NOT NULL,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "bank_id" TEXT NOT NULL,
ADD COLUMN     "banker_name" TEXT NOT NULL,
ADD COLUMN     "business_type_id" TEXT NOT NULL,
ADD COLUMN     "case_type" TEXT NOT NULL,
ADD COLUMN     "created_by_department" TEXT NOT NULL,
ADD COLUMN     "created_by_employee_id" TEXT NOT NULL,
ADD COLUMN     "created_by_first_name" TEXT NOT NULL,
ADD COLUMN     "created_by_role" TEXT NOT NULL,
ADD COLUMN     "customer_contact_number" TEXT NOT NULL,
ADD COLUMN     "customer_name" TEXT NOT NULL,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_department" TEXT,
ADD COLUMN     "deleted_by_employee_id" TEXT,
ADD COLUMN     "deleted_by_first_name" TEXT,
ADD COLUMN     "deleted_by_id" TEXT,
ADD COLUMN     "deleted_by_role" TEXT,
ADD COLUMN     "file_number" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "allocations" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "allocated_by_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "allocated_by_first_name" TEXT NOT NULL,
    "allocated_by_employee_id" TEXT NOT NULL,
    "allocated_by_role" TEXT NOT NULL,
    "allocated_by_department" TEXT NOT NULL,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "business_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "allocations_case_id_idx" ON "allocations"("case_id");

-- CreateIndex
CREATE INDEX "allocations_user_id_idx" ON "allocations"("user_id");

-- CreateIndex
CREATE INDEX "allocations_role_id_idx" ON "allocations"("role_id");

-- CreateIndex
CREATE INDEX "allocations_status_id_idx" ON "allocations"("status_id");

-- CreateIndex
CREATE INDEX "allocations_allocated_by_id_idx" ON "allocations"("allocated_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "allocations_case_id_sequence_key" ON "allocations"("case_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "business_types_name_key" ON "business_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "statuses_name_key" ON "statuses"("name");

-- CreateIndex
CREATE INDEX "banks_name_idx" ON "banks"("name");

-- CreateIndex
CREATE INDEX "banks_gst_number_idx" ON "banks"("gst_number");

-- CreateIndex
CREATE INDEX "banks_branch_code_idx" ON "banks"("branch_code");

-- CreateIndex
CREATE INDEX "branches_name_idx" ON "branches"("name");

-- CreateIndex
CREATE INDEX "cases_deleted_by_id_idx" ON "cases"("deleted_by_id");

-- CreateIndex
CREATE INDEX "cases_business_type_id_idx" ON "cases"("business_type_id");

-- CreateIndex
CREATE INDEX "cases_bank_id_idx" ON "cases"("bank_id");

-- CreateIndex
CREATE UNIQUE INDEX "cases_file_number_branch_id_key" ON "cases"("file_number", "branch_id");

-- CreateIndex
CREATE INDEX "departments_name_branch_id_idx" ON "departments"("name", "branch_id");

-- CreateIndex
CREATE INDEX "roles_name_department_id_idx" ON "roles"("name", "department_id");

-- CreateIndex
CREATE INDEX "users_employee_id_idx" ON "users"("employee_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_aadhaar_number_idx" ON "users"("aadhaar_number");

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_allocated_by_id_fkey" FOREIGN KEY ("allocated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
