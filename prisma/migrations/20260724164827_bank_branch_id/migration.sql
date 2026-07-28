-- AlterTable
ALTER TABLE "banks" ADD COLUMN     "branch_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "banks_branch_id_idx" ON "banks"("branch_id");

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

