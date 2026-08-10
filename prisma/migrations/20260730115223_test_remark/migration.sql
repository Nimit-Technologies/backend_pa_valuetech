-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_update_histories" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "updated_by_id" TEXT NOT NULL,
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

-- CreateIndex
CREATE INDEX "cases_branch_id_idx" ON "cases"("branch_id");

-- CreateIndex
CREATE INDEX "cases_user_id_idx" ON "cases"("user_id");

-- CreateIndex
CREATE INDEX "cases_address_id_idx" ON "cases"("address_id");

-- CreateIndex
CREATE INDEX "cases_created_by_id_idx" ON "cases"("created_by_id");

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

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
