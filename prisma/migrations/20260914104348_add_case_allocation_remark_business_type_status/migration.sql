-- DropIndex
DROP INDEX "departments_name_branch_id_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "allocations" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "business_type_id" TEXT NOT NULL,
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
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "file_number" TEXT NOT NULL,
    "banker_name" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_contact_number" TEXT NOT NULL,
    "case_type" TEXT NOT NULL,
    "business_type_id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "deleted_by_id" TEXT,
    "created_by_first_name" TEXT NOT NULL,
    "created_by_employee_id" TEXT NOT NULL,
    "created_by_role" TEXT NOT NULL,
    "created_by_department" TEXT NOT NULL,
    "deleted_by_first_name" TEXT,
    "deleted_by_employee_id" TEXT,
    "deleted_by_role" TEXT,
    "deleted_by_department" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_update_histories" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "updated_by_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_update_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remarks" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "case_id" TEXT,
    "user_id" TEXT,
    "branch_id" TEXT,
    "department_id" TEXT,
    "role_id" TEXT,
    "first_name" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "department_name" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

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
CREATE INDEX "business_types_name_idx" ON "business_types"("name");

-- CreateIndex
CREATE INDEX "cases_file_number_branch_id_idx" ON "cases"("file_number", "branch_id");

-- CreateIndex
CREATE INDEX "cases_branch_id_idx" ON "cases"("branch_id");

-- CreateIndex
CREATE INDEX "cases_user_id_idx" ON "cases"("user_id");

-- CreateIndex
CREATE INDEX "cases_address_id_idx" ON "cases"("address_id");

-- CreateIndex
CREATE INDEX "cases_created_by_id_idx" ON "cases"("created_by_id");

-- CreateIndex
CREATE INDEX "cases_deleted_by_id_idx" ON "cases"("deleted_by_id");

-- CreateIndex
CREATE INDEX "cases_business_type_id_idx" ON "cases"("business_type_id");

-- CreateIndex
CREATE INDEX "cases_bank_id_idx" ON "cases"("bank_id");

-- CreateIndex
CREATE INDEX "case_update_histories_case_id_idx" ON "case_update_histories"("case_id");

-- CreateIndex
CREATE INDEX "case_update_histories_updated_by_id_idx" ON "case_update_histories"("updated_by_id");

-- CreateIndex
CREATE INDEX "remarks_case_id_idx" ON "remarks"("case_id");

-- CreateIndex
CREATE INDEX "remarks_user_id_idx" ON "remarks"("user_id");

-- CreateIndex
CREATE INDEX "remarks_branch_id_idx" ON "remarks"("branch_id");

-- CreateIndex
CREATE INDEX "remarks_department_id_idx" ON "remarks"("department_id");

-- CreateIndex
CREATE INDEX "remarks_role_id_idx" ON "remarks"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "statuses_name_key" ON "statuses"("name");

-- CreateIndex
CREATE INDEX "statuses_name_idx" ON "statuses"("name");

-- CreateIndex
CREATE INDEX "branches_name_idx" ON "branches"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE INDEX "departments_name_branch_id_idx" ON "departments"("name", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "users_employee_id_idx" ON "users"("employee_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_allocated_by_id_fkey" FOREIGN KEY ("allocated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_update_histories" ADD CONSTRAINT "case_update_histories_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_update_histories" ADD CONSTRAINT "case_update_histories_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remarks" ADD CONSTRAINT "remarks_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remarks" ADD CONSTRAINT "remarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remarks" ADD CONSTRAINT "remarks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remarks" ADD CONSTRAINT "remarks_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remarks" ADD CONSTRAINT "remarks_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

