-- CreateTable
CREATE TABLE "case_files" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploader_role" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "case_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "case_files_storage_path_key" ON "case_files"("storage_path");

-- CreateIndex
CREATE INDEX "case_files_case_id_idx" ON "case_files"("case_id");

-- CreateIndex
CREATE INDEX "case_files_branch_id_idx" ON "case_files"("branch_id");

-- CreateIndex
CREATE INDEX "case_files_uploaded_by_id_idx" ON "case_files"("uploaded_by_id");

-- AddForeignKey
ALTER TABLE "case_files" ADD CONSTRAINT "case_files_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_files" ADD CONSTRAINT "case_files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
