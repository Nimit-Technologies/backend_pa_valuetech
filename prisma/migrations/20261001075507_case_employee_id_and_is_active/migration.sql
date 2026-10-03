/*
  Warnings:

  - You are about to drop the column `user_id` on the `cases` table. All the data in the column will be lost.
  - Added the required column `employee_id` to the `cases` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cases" DROP CONSTRAINT "cases_user_id_fkey";

-- DropIndex
DROP INDEX "cases_user_id_idx";

-- AlterTable
ALTER TABLE "cases" DROP COLUMN "user_id",
ADD COLUMN     "employee_id" TEXT NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "cases_employee_id_idx" ON "cases"("employee_id");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;
