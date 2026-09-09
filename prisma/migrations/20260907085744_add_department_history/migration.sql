-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "history" JSONB NOT NULL DEFAULT '[]';
