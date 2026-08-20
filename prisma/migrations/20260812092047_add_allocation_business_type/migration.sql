/*
  Warnings:

  - Added the required column `business_type_id` to the `allocations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "allocations" ADD COLUMN     "business_type_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
