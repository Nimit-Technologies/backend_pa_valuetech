-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "history" JSONB NOT NULL DEFAULT '[]';
