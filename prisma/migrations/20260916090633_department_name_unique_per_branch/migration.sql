-- DropIndex
DROP INDEX "departments_name_branch_id_idx";

-- DropIndex
DROP INDEX "departments_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_branch_id_key" ON "departments"("name", "branch_id");
