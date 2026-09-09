/*
  Warnings:

  - Added the required column `branch_id` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "roles_name_department_id_idx";

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "branch_id" TEXT NOT NULL,
ADD COLUMN     "history" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE INDEX "roles_name_department_id_branch_id_idx" ON "roles"("name", "department_id", "branch_id");

-- CreateIndex
CREATE INDEX "roles_branch_id_idx" ON "roles"("branch_id");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
