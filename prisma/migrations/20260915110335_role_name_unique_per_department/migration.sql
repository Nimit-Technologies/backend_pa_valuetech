-- DropIndex
DROP INDEX "roles_name_department_id_branch_id_idx";

-- DropIndex
DROP INDEX "roles_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_department_id_key" ON "roles"("name", "department_id");

