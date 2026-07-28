-- DropForeignKey
ALTER TABLE "banks" DROP CONSTRAINT "banks_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "banks" DROP CONSTRAINT "banks_department_id_fkey";

-- DropForeignKey
ALTER TABLE "banks" DROP CONSTRAINT "banks_role_id_fkey";

-- DropForeignKey
ALTER TABLE "banks" DROP CONSTRAINT "banks_updated_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "business_types" DROP CONSTRAINT "business_types_department_id_fkey";

-- DropForeignKey
ALTER TABLE "business_types" DROP CONSTRAINT "business_types_role_id_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_branch_id_fkey";

-- DropIndex
DROP INDEX "banks_created_by_user_id_idx";

-- DropIndex
DROP INDEX "banks_department_id_idx";

-- DropIndex
DROP INDEX "banks_role_id_idx";

-- DropIndex
DROP INDEX "banks_updated_by_user_id_idx";

-- DropIndex
DROP INDEX "business_types_department_id_idx";

-- DropIndex
DROP INDEX "business_types_role_id_idx";

-- DropIndex
DROP INDEX "roles_branch_id_idx";

-- DropIndex
DROP INDEX "roles_name_branch_id_key";

-- DropIndex
DROP INDEX "users_adhar_number_key";

-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "banks" DROP COLUMN "bank_branch",
DROP COLUMN "created_by_user_id",
DROP COLUMN "department_id",
DROP COLUMN "role_id",
DROP COLUMN "updated_by_user_id",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "business_types" DROP COLUMN "department_id",
DROP COLUMN "role_id";

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "branch_id",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "department_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "adhar_number",
ADD COLUMN     "aadhaar_number" TEXT NOT NULL,
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "roles_department_id_idx" ON "roles"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_department_id_key" ON "roles"("name", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_aadhaar_number_key" ON "users"("aadhaar_number");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

