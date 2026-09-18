-- AlterTable
ALTER TABLE "users" ADD COLUMN     "history" JSONB NOT NULL DEFAULT '[]';
