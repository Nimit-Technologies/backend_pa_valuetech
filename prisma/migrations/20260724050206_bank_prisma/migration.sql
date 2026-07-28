/*
  Warnings:

  - You are about to drop the column `updated_at` on the `case_update_histories` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by_id` on the `case_update_histories` table. All the data in the column will be lost.
  - You are about to drop the column `created_by_id` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `cases` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[branch_id,file_number]` on the table `cases` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `changes` to the `case_update_histories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_by_user_id` to the `case_update_histories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assigned_to_user_id` to the `cases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bank_id` to the `cases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `banker_name` to the `cases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_type_id` to the `cases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `case_type` to the `cases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by_user_id` to the `cases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_contact_number` to the `cases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_name` to the `cases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_number` to the `cases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `cases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_by_user_id` to the `cases` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'CLOSED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "case_update_histories" DROP CONSTRAINT "case_update_histories_case_id_fkey";

-- DropForeignKey
ALTER TABLE "case_update_histories" DROP CONSTRAINT "case_update_histories_updated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "cases" DROP CONSTRAINT "cases_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "cases" DROP CONSTRAINT "cases_user_id_fkey";

-- DropIndex
DROP INDEX "case_update_histories_updated_by_id_idx";

-- DropIndex
DROP INDEX "cases_branch_id_idx";

-- DropIndex
DROP INDEX "cases_created_by_id_idx";

-- DropIndex
DROP INDEX "cases_user_id_idx";

-- AlterTable
ALTER TABLE "case_update_histories" DROP COLUMN "updated_at",
DROP COLUMN "updated_by_id",
ADD COLUMN     "changes" JSONB NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "updated_by_user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "cases" DROP COLUMN "created_by_id",
DROP COLUMN "user_id",
ADD COLUMN     "assigned_to_user_id" TEXT NOT NULL,
ADD COLUMN     "bank_id" TEXT NOT NULL,
ADD COLUMN     "banker_name" TEXT NOT NULL,
ADD COLUMN     "business_type_id" TEXT NOT NULL,
ADD COLUMN     "case_type" TEXT NOT NULL,
ADD COLUMN     "created_by_user_id" TEXT NOT NULL,
ADD COLUMN     "customer_contact_number" TEXT NOT NULL,
ADD COLUMN     "customer_name" TEXT NOT NULL,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "file_number" TEXT NOT NULL,
ADD COLUMN     "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by_user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bank_branch" TEXT NOT NULL,
    "gst_number" TEXT NOT NULL,
    "branch_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "address_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "updated_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "updated_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remarks" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT,
    "content" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banks_name_key" ON "banks"("name");

-- CreateIndex
CREATE UNIQUE INDEX "banks_address_id_key" ON "banks"("address_id");

-- CreateIndex
CREATE INDEX "banks_role_id_idx" ON "banks"("role_id");

-- CreateIndex
CREATE INDEX "banks_department_id_idx" ON "banks"("department_id");

-- CreateIndex
CREATE INDEX "banks_created_by_user_id_idx" ON "banks"("created_by_user_id");

-- CreateIndex
CREATE INDEX "banks_updated_by_user_id_idx" ON "banks"("updated_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_types_name_key" ON "business_types"("name");

-- CreateIndex
CREATE INDEX "business_types_role_id_idx" ON "business_types"("role_id");

-- CreateIndex
CREATE INDEX "business_types_department_id_idx" ON "business_types"("department_id");

-- CreateIndex
CREATE INDEX "business_types_created_by_user_id_idx" ON "business_types"("created_by_user_id");

-- CreateIndex
CREATE INDEX "business_types_updated_by_user_id_idx" ON "business_types"("updated_by_user_id");

-- CreateIndex
CREATE INDEX "remarks_case_id_idx" ON "remarks"("case_id");

-- CreateIndex
CREATE INDEX "remarks_user_id_idx" ON "remarks"("user_id");

-- CreateIndex
CREATE INDEX "remarks_case_id_created_at_idx" ON "remarks"("case_id", "created_at");

-- CreateIndex
CREATE INDEX "case_update_histories_updated_by_user_id_idx" ON "case_update_histories"("updated_by_user_id");

-- CreateIndex
CREATE INDEX "case_update_histories_case_id_created_at_idx" ON "case_update_histories"("case_id", "created_at");

-- CreateIndex
CREATE INDEX "cases_assigned_to_user_id_idx" ON "cases"("assigned_to_user_id");

-- CreateIndex
CREATE INDEX "cases_created_by_user_id_idx" ON "cases"("created_by_user_id");

-- CreateIndex
CREATE INDEX "cases_updated_by_user_id_idx" ON "cases"("updated_by_user_id");

-- CreateIndex
CREATE INDEX "cases_business_type_id_idx" ON "cases"("business_type_id");

-- CreateIndex
CREATE INDEX "cases_bank_id_idx" ON "cases"("bank_id");

-- CreateIndex
CREATE INDEX "cases_customer_contact_number_idx" ON "cases"("customer_contact_number");

-- CreateIndex
CREATE INDEX "cases_branch_id_status_idx" ON "cases"("branch_id", "status");

-- CreateIndex
CREATE INDEX "cases_deleted_at_idx" ON "cases"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "cases_branch_id_file_number_key" ON "cases"("branch_id", "file_number");

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_types" ADD CONSTRAINT "business_types_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_types" ADD CONSTRAINT "business_types_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_types" ADD CONSTRAINT "business_types_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_types" ADD CONSTRAINT "business_types_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_update_histories" ADD CONSTRAINT "case_update_histories_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_update_histories" ADD CONSTRAINT "case_update_histories_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remarks" ADD CONSTRAINT "remarks_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remarks" ADD CONSTRAINT "remarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
